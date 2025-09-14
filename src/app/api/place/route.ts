import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // multipart/form-data에서 데이터 추출
    const metaString = formData.get('meta') as string;
    const imageFile = formData.get('image') as File;
    
    if (!metaString || !imageFile) {
      return NextResponse.json(
        { success: false, error: 'meta 또는 image가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // meta JSON 파싱
    const meta = JSON.parse(metaString);
    const { name, address, description, tags } = meta;
    
    // 필수 필드 검증
    console.log('받은 메타데이터:', { name, address, description, tags });
    console.log('필드 검증:', {
      name: !!name,
      address: !!address,
      description: !!description,
      tags: !!tags,
      isArray: Array.isArray(tags)
    });
    
    if (!name || !address || !description || !tags || !Array.isArray(tags)) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!address) missingFields.push('address');
      if (!description) missingFields.push('description');
      if (!tags) missingFields.push('tags');
      if (tags && !Array.isArray(tags)) missingFields.push('tags (not array)');
      
      console.log('누락된 필드:', missingFields);
      return NextResponse.json(
        { success: false, error: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // TODO: 실제 하이라이트 저장 로직 구현
    // 1. 이미지 파일을 서버에 저장하거나 외부 스토리지에 업로드
    // 2. 메타데이터와 함께 데이터베이스에 저장
    
    console.log('하이라이트 등록 요청:', {
      name,
      address,
      description,
      tags,
      imageSize: imageFile.size,
      imageType: imageFile.type
    });
    
    // 임시 응답 (실제 구현 시 변경 필요)
    return NextResponse.json({
      success: true,
      message: '하이라이트가 성공적으로 등록되었습니다.',
      data: {
        id: Date.now(), // 임시 ID
        name,
        address,
        description,
        tags,
        imageUrl: `https://example.com/images/${Date.now()}.jpg` // 임시 URL
      }
    });
    
  } catch (error) {
    console.error('하이라이트 등록 에러:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
