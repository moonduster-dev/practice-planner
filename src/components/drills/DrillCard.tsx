'use client';

import { useState } from 'react';
import { Drill, Equipment } from '@/types';
import { Button, Card, Badge, Modal } from '@/components/ui';

interface DrillCardProps {
  drill: Drill;
  equipment: Equipment[];
  onEdit: (drill: Drill) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

/**
 * Converts various video URLs to embeddable formats
 */
function getEmbedInfo(url: string): { embedUrl: string; type: 'youtube' | 'gdrive' | 'vimeo' | 'tiktok' | 'direct' | 'iframe'; needsClickThrough?: boolean } | null {
  if (!url) return null;

  // YouTube URLs (watch, embed, shorts, youtu.be)
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return {
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`,
      type: 'youtube',
    };
  }

  // Google Drive URLs (file/d/, open?id=, uc?id=)
  // Use embedded player URL format which has better compatibility
  const gdriveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveFileMatch) {
    return {
      embedUrl: `https://drive.google.com/file/d/${gdriveFileMatch[1]}/preview?usp=sharing`,
      type: 'gdrive',
    };
  }

  const gdriveOpenMatch = url.match(/drive\.google\.com\/(?:open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
  if (gdriveOpenMatch) {
    return {
      embedUrl: `https://drive.google.com/file/d/${gdriveOpenMatch[1]}/preview?usp=sharing`,
      type: 'gdrive',
    };
  }

  // Vimeo URLs
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      type: 'vimeo',
    };
  }

  // TikTok URLs - TikTok doesn't support direct iframe embedding
  // Must use their embed API or click through to the site
  const tiktokMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/i) ||
                      url.match(/tiktok\.com\/t\/([\w]+)/i) ||
                      url.match(/vm\.tiktok\.com\/([\w]+)/i);
  if (tiktokMatch) {
    return {
      embedUrl: url,
      type: 'tiktok',
      needsClickThrough: true,
    };
  }

  // Direct video URLs (mp4, webm, mov, etc.)
  if (url.match(/\.(mp4|webm|ogg|mov|m4v)(\?|$|#)/i)) {
    return {
      embedUrl: url,
      type: 'direct',
    };
  }

  // Fallback: try to embed any URL as iframe (works for many video hosting sites)
  // This handles Loom, Streamable, and other video hosts that support iframe embedding
  return {
    embedUrl: url,
    type: 'iframe',
  };
}

const categoryColors: Record<string, string> = {
  warmup: 'bg-orange-100 text-orange-800',
  hitting: 'bg-red-100 text-red-800',
  fielding: 'bg-green-100 text-green-800',
  pitching: 'bg-blue-100 text-blue-800',
  catching: 'bg-purple-100 text-purple-800',
  iq: 'bg-yellow-100 text-yellow-800',
  games: 'bg-pink-100 text-pink-800',
};

export default function DrillCard({
  drill,
  equipment,
  onEdit,
  onDelete,
  compact = false,
}: DrillCardProps) {
  const [showVideo, setShowVideo] = useState(false);
  const drillEquipment = equipment.filter((e) => drill.equipmentIds.includes(e.id));
  const embedInfo = drill.videoUrl ? getEmbedInfo(drill.videoUrl) : null;

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[drill.category]}`}>
            {drill.category}
          </span>
          <span className="font-medium text-gray-900">{drill.title}</span>
          <span className="text-sm text-gray-500">{drill.baseDuration}m</span>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[drill.category]}`}>
              {drill.category}
            </span>
            <Badge variant="default">{drill.baseDuration} min</Badge>
            <Badge variant={
              drill.skillLevel === 'beginner' ? 'success' :
              drill.skillLevel === 'intermediate' ? 'warning' : 'danger'
            }>
              {drill.skillLevel}
            </Badge>
          </div>

          <h3 className="text-lg font-semibold text-gray-900">{drill.title}</h3>

          {drill.description && (
            <p className="text-gray-600 mt-1 text-sm whitespace-pre-wrap">{drill.description}</p>
          )}

          {drill.coachNotes && (
            <p className="text-gray-500 mt-2 text-sm italic whitespace-pre-wrap">
              Coach notes: {drill.coachNotes}
            </p>
          )}

          {drill.location && (
            <p className="text-gray-500 mt-1 text-sm">
              Location: {drill.location.replace(/_/g, ' ')}
            </p>
          )}

          {drillEquipment.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {drillEquipment.map((item) => (
                <span
                  key={item.id}
                  className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                >
                  {item.name}
                </span>
              ))}
            </div>
          )}

          {drill.videoUrl && (
            <button
              onClick={() => setShowVideo(true)}
              className="inline-flex items-center mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Video
            </button>
          )}

          {drill.usageCount > 0 && (
            <p className="text-gray-400 mt-2 text-xs">
              Used {drill.usageCount} times
              {drill.averageRating > 0 && ` | Avg rating: ${drill.averageRating.toFixed(1)}/5`}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <Button variant="ghost" size="sm" onClick={() => onEdit(drill)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(drill.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Video Modal */}
      <Modal
        isOpen={showVideo}
        onClose={() => setShowVideo(false)}
        title={`${drill.title} - Video`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {embedInfo ? (
              embedInfo.needsClickThrough ? (
                // TikTok and other platforms that don't allow embedding
                <div className="flex flex-col items-center justify-center h-full text-white bg-gray-900">
                  <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-300 mb-2">
                    {embedInfo.type === 'tiktok' ? 'TikTok videos' : 'This video'} cannot be embedded directly
                  </p>
                  <a
                    href={drill.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Watch on {embedInfo.type === 'tiktok' ? 'TikTok' : 'original site'}
                  </a>
                </div>
              ) : embedInfo.type === 'direct' ? (
                <video
                  src={embedInfo.embedUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
              ) : embedInfo.type === 'gdrive' ? (
                // Google Drive with special handling for permission issues
                <div className="relative w-full h-full">
                  <iframe
                    src={embedInfo.embedUrl}
                    className="w-full h-full"
                    allow="autoplay"
                    allowFullScreen
                    title={`${drill.title} video`}
                  />
                </div>
              ) : (
                <iframe
                  src={embedInfo.embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${drill.title} video`}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white">
                <p className="mb-4">Unable to embed this video.</p>
              </div>
            )}
          </div>
          {/* Always show link to open in new tab */}
          <div className="text-center space-y-2">
            <a
              href={drill.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in new tab
            </a>
            {embedInfo?.type === 'gdrive' && (
              <p className="text-xs text-gray-500">
                If the video doesn&apos;t load, ensure it&apos;s shared as &quot;Anyone with the link can view&quot;
              </p>
            )}
          </div>
        </div>
      </Modal>
    </Card>
  );
}
