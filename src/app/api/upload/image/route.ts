import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 파일 유효성 검사
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '파일 크기가 너무 큽니다. (최대 5MB)' },
        { status: 400 }
      );
    }

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `img_${timestamp}_${randomString}.${fileExtension}`;

    // 업로드 디렉토리 생성
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'images');
    const year = new Date().getFullYear().toString();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const day = new Date().getDate().toString().padStart(2, '0');
    const dateDir = join(uploadDir, year, month, day);

    if (!existsSync(dateDir)) {
      await mkdir(dateDir, { recursive: true });
    }

    // 파일 저장
    const filePath = join(dateDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 접근 가능한 URL 생성
    const imageUrl = `/uploads/images/${year}/${month}/${day}/${fileName}`;

    console.log(`📸 이미지 업로드 완료: ${fileName}`);
    console.log(`   크기: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`   URL: ${imageUrl}`);

    return NextResponse.json({
      success: true,
      imageUrl,
      fileName,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    return NextResponse.json(
      { error: '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}