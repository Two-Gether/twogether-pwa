"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import CloseIcon from '@/components/icons/CloseIcon';
import SirenIcon from '@/components/icons/SirenIcon';
import Tag from '@/components/ui/Tag';
import { useRouter, useSearchParams } from 'next/navigation';

export default function HighlightPhotoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [imageUrl, setImageUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tagsParam, setTagsParam] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  // 세션 스토리지에서 데이터 복원 (우선순위: sessionStorage > URL params)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = sessionStorage.getItem('HIGHLIGHT_VIEWER_DATA');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setImageUrl(parsed.url || '');
          setDescription(parsed.desc || '');
          setTagsParam(JSON.stringify(parsed.tags || []));
          return;
        } catch {
        }
      }
    }
    // fallback to URL params
    setImageUrl(searchParams.get('url') || '');
    setDescription(searchParams.get('desc') || '');
    setTagsParam(searchParams.get('tags') || '');
  }, [searchParams]);

  // 상단 진행바(10초) + 자동 닫기
  useEffect(() => {
    const totalMs = 10000; // 10s
    const tickMs = 100; // update every 0.1s
    let elapsed = 0;

    const timerId = window.setInterval(() => {
      elapsed += tickMs;
      const ratio = Math.min(1, elapsed / totalMs);
      setProgress(Math.round(ratio * 100));
      if (ratio >= 1) {
        window.clearInterval(timerId);
        // 자동 닫기
        router.back();
      }
    }, tickMs);

    return () => window.clearInterval(timerId);
  }, [router]);

  // tags는 "," 구분자 또는 JSON 배열 문자열 모두 허용
  const tags = useMemo(() => {
    if (!tagsParam) return [] as string[];
    try {
      const parsed = JSON.parse(tagsParam);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
    }
    return tagsParam.split(',').map(t => t.trim()).filter(Boolean);
  }, [tagsParam]);

  return (
    <div className="fixed inset-0 bg-black text-white">
      {/* 스토리 진행바 */}
      <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-white/20">
        <div
          className="h-full bg-white"
          style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
        />
      </div>
      {/* 상단 바 */}
      <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-end gap-2 px-3 bg-gradient-to-b from-black/60 to-transparent z-20">
        <button
          type="button"
          aria-label="신고하기"
          className="p-2"
          onClick={() => {
            const reportUrl = process.env.NEXT_PUBLIC_REPORT_URL || 'https://www.notion.so';
            if (typeof window !== 'undefined') {
              window.open(reportUrl, '_blank');
            }
          }}
        >
          <SirenIcon width={22} height={22} className="text-gray-100" />
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="닫기"
          className="p-2"
        >
          <CloseIcon width={25} height={25} className="text-gray-100" />
        </button>
      </div>

      {/* 이미지 영역 - 전체 화면 중앙 정렬 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={description || 'highlight photo'}
            fill
            priority
            className="object-contain"
          />
        ) : (
          <div className="text-gray-400">이미지를 불러올 수 없습니다.</div>
        )}
      </div>

      {/* 하단 캡션/태그 */}
      <div className="absolute left-0 right-0 bottom-0 z-20 p-4 pb-6 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
        <span className="hidden">
          {(() => { try { console.log('[뷰어 태그]', JSON.parse(tagsParam)); } catch { console.log('[뷰어 태그]', tagsParam); } return null; })()}
        </span>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <Tag key={tag} type="review" variant="default" className="!px-3 !py-1.5 !text-xs">
                {tag}
              </Tag>
            ))}
          </div>
        )}

        {description && (
          <div
            className="mb-3 break-words font-pretendard text-base font-normal"
            style={{ color: 'var(--Color-Gray-100)' }}
          >
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
