'use client';

import { useState, useEffect, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Practice, Player, Drill, Equipment, Coach, SessionBlock, Group } from '@/types';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { calculateBlockDuration } from '@/lib/timeEngine';

interface CoachViewPageProps {
  params: Promise<{ id: string }>;
}

// Video embed helper
function getEmbedInfo(url: string): { embedUrl: string; type: string; needsClickThrough?: boolean } | null {
  if (!url) return null;

  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return { embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`, type: 'youtube' };
  }

  const gdriveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveFileMatch) {
    return { embedUrl: `https://drive.google.com/file/d/${gdriveFileMatch[1]}/preview?usp=sharing`, type: 'gdrive' };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, type: 'vimeo' };
  }

  const tiktokMatch = url.match(/tiktok\.com/i);
  if (tiktokMatch) {
    return { embedUrl: url, type: 'tiktok', needsClickThrough: true };
  }

  if (url.match(/\.(mp4|webm|ogg|mov|m4v)(\?|$|#)/i)) {
    return { embedUrl: url, type: 'direct' };
  }

  return { embedUrl: url, type: 'iframe' };
}

export default function CoachViewPage({ params }: CoachViewPageProps) {
  const { id } = use(params);
  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);

  const { data: players } = useFirestoreCollection<Player>('players');
  const { data: drills } = useFirestoreCollection<Drill>('drills');
  const { data: coaches } = useFirestoreCollection<Coach>('coaches');
  const { data: equipment } = useFirestoreCollection<Equipment>('equipment');

  useEffect(() => {
    const fetchPractice = async () => {
      try {
        const docRef = doc(db, 'practices', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setPractice({
            id: docSnap.id,
            ...data,
            date: data.date?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Practice);
        }
      } catch (error) {
        console.error('Error fetching practice:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPractice();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading practice...</p>
      </div>
    );
  }

  if (!practice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Practice not found</p>
      </div>
    );
  }

  const groupArray = Object.values(practice.groups || {});
  const presentPlayers = players.filter((p) => practice.attendance[p.id]);

  // Calculate running time
  let runningTime = 0;

  const getGroupNames = (groupIds?: string[], drillGroups?: Record<string, Group>) => {
    if (!groupIds || groupIds.length === 0) return 'All';
    return groupIds
      .map((gid) => {
        // Use drill-specific group name if available
        if (drillGroups && drillGroups[gid]) {
          return drillGroups[gid].name;
        }
        return practice.groups[gid]?.name || 'Unknown';
      })
      .join(', ');
  };

  const getPlayersInDrillGroups = (block: SessionBlock) => {
    // Returns player names for drill-specific groups, showing modified partnerships
    if (!block.drillGroups || Object.keys(block.drillGroups).length === 0) return null;
    if (!block.groupIds || block.groupIds.length === 0) return null;

    return block.groupIds.map((gid) => {
      const drillGroup = block.drillGroups?.[gid];
      if (!drillGroup) return null;
      const playerNames = drillGroup.playerIds
        .map((pid) => players.find((p) => p.id === pid)?.name || 'Unknown')
        .join(', ');
      return { groupName: drillGroup.name, players: playerNames };
    }).filter(Boolean);
  };

  const getCoachNames = (block: SessionBlock) => {
    const coachIds = block.coachIds || (block.coachId ? [block.coachId] : []);
    if (coachIds.length === 0) return null;
    return coachIds.map((cid) => coaches.find((c) => c.id === cid)?.name || 'Unknown').join(', ');
  };

  const getPlayerNamesInGroup = (group: Group) => {
    return group.playerIds
      .map((pid) => players.find((p) => p.id === pid)?.name || 'Unknown');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy-900 border-b border-navy-800 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gold-400 rounded-full flex items-center justify-center">
                <span className="text-navy-900 font-black text-lg">GC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  GC Falcons Practice Plan
                </h1>
                <p className="text-navy-200">
                  {practice.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gold-400">
                {practice.totalMinutes} min
              </div>
              <div className="text-sm text-navy-200">
                {presentPlayers.length} players
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Groups/Partners Overview */}
        {groupArray.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h2 className="font-semibold text-navy-900 mb-3">Groups / Partners</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {groupArray.map((group) => (
                <div
                  key={group.id}
                  className="bg-navy-50 border border-navy-200 rounded-lg p-3"
                >
                  <div className="font-medium text-navy-900 text-sm mb-2">
                    {group.name}
                    {group.playerIds.length === 3 && (
                      <span className="ml-1 text-xs text-navy-600">(trio)</span>
                    )}
                  </div>
                  <ul className="text-xs text-navy-700 space-y-0.5">
                    {getPlayerNamesInGroup(group).map((name, idx) => (
                      <li key={idx}>• {name}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule */}
        <div className="space-y-4">
          <h2 className="font-semibold text-navy-900">Schedule</h2>

          {practice.sessionBlocks.map((block, index) => {
            const duration = calculateBlockDuration(block);
            const startTime = runningTime;
            runningTime += duration;
            const drill = block.drillId ? drills.find((d) => d.id === block.drillId) : undefined;
            const isWaterBreak = block.notes === 'Water Break';
            const coachNames = getCoachNames(block);
            const embedInfo = drill?.videoUrl ? getEmbedInfo(drill.videoUrl) : null;
            const isVideoExpanded = expandedVideo === block.id;

            return (
              <div
                key={block.id}
                className={`bg-white rounded-lg border ${
                  isWaterBreak
                    ? 'border-blue-300 bg-blue-50'
                    : block.type === 'rotation'
                    ? 'border-purple-300'
                    : 'border-gray-200'
                } overflow-hidden`}
              >
                {/* Block Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-mono text-gray-500 min-w-[60px]">
                        {startTime}:{String(0).padStart(2, '0')} -
                      </div>
                      <div>
                        {isWaterBreak ? (
                          <div className="font-semibold text-blue-700 text-lg">
                            Water Break
                          </div>
                        ) : block.type === 'rotation' ? (
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                                ROTATION
                              </span>
                              <span className="font-semibold text-gray-900">
                                {block.notes || 'Rotation Block'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-gray-900 text-lg">
                              {drill?.title || 'Unknown Drill'}
                            </div>
                            {drill?.category && (
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                                {
                                  warmup: 'bg-orange-100 text-orange-800',
                                  hitting: 'bg-red-100 text-red-800',
                                  fielding: 'bg-green-100 text-green-800',
                                  pitching: 'bg-blue-100 text-blue-800',
                                  catching: 'bg-purple-100 text-purple-800',
                                  iq: 'bg-yellow-100 text-yellow-800',
                                  games: 'bg-pink-100 text-pink-800',
                                }[drill.category] || 'bg-gray-100 text-gray-800'
                              }`}>
                                {drill.category}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{duration} min</div>
                    </div>
                  </div>

                  {/* Single Drill Details */}
                  {block.type === 'single' && !isWaterBreak && (
                    <div className="mt-3 space-y-2">
                      {coachNames && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Coach:</span> {coachNames}
                        </div>
                      )}

                      {block.groupIds && block.groupIds.length > 0 && block.groupIds.length < groupArray.length && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Groups:</span> {getGroupNames(block.groupIds, block.drillGroups)}
                        </div>
                      )}

                      {/* Show drill-specific partner assignments if modified */}
                      {block.drillGroups && Object.keys(block.drillGroups).length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                          <div className="text-xs text-amber-700 font-medium mb-2">
                            ✎ Partners modified for this drill:
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {(block.groupIds || []).map((gid) => {
                              const drillGroup = block.drillGroups?.[gid];
                              if (!drillGroup) return null;
                              return (
                                <div key={gid} className="bg-white rounded px-2 py-1.5 text-xs">
                                  <div className="font-medium text-amber-800 mb-1">{drillGroup.name}</div>
                                  <ul className="text-gray-600 space-y-0.5">
                                    {drillGroup.playerIds.map((pid) => (
                                      <li key={pid}>• {players.find((p) => p.id === pid)?.name || 'Unknown'}</li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {drill?.description && (
                        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                          {drill.description}
                        </div>
                      )}

                      {drill?.coachNotes && (
                        <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded whitespace-pre-wrap">
                          <span className="font-medium">Coach Notes:</span> {drill.coachNotes}
                        </div>
                      )}

                      {block.notes && (
                        <div className="text-sm text-gray-600 italic">
                          Note: {block.notes}
                        </div>
                      )}

                      {drill?.videoUrl && (
                        <div className="mt-3">
                          <button
                            onClick={() => setExpandedVideo(isVideoExpanded ? null : block.id)}
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {isVideoExpanded ? 'Hide Video' : 'Watch Video'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rotation Details */}
                  {block.type === 'rotation' && block.rotationDrills && (
                    <div className="mt-4 space-y-3">
                      {block.rotationDrills.map((rd, rdIndex) => {
                        const stationDrill = drills.find((d) => d.id === rd.drillId);
                        const stationCoaches = rd.coachIds?.map((cid) => coaches.find((c) => c.id === cid)?.name).filter(Boolean).join(', ');
                        const stationGroups = rd.groupIds?.map((gid) => practice.groups[gid]?.name).filter(Boolean).join(', ');
                        const stationEmbedInfo = stationDrill?.videoUrl ? getEmbedInfo(stationDrill.videoUrl) : null;
                        const isStationVideoExpanded = expandedVideo === `${block.id}-${rdIndex}`;
                        const hasStationModifiedPartners = rd.stationGroups && Object.keys(rd.stationGroups).length > 0;

                        return (
                          <div
                            key={rdIndex}
                            className="bg-purple-50 border border-purple-200 rounded-lg p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium text-purple-900">
                                  {rd.stationName || `Station ${rdIndex + 1}`}
                                </div>
                                <div className="text-sm text-purple-700">
                                  {stationDrill?.title || 'Unknown Drill'}
                                </div>
                                {stationCoaches && (
                                  <div className="text-xs text-purple-600 mt-1">
                                    Coach: {stationCoaches}
                                  </div>
                                )}
                                {stationGroups && (
                                  <div className="text-xs text-purple-600">
                                    Groups: {stationGroups}
                                  </div>
                                )}
                              </div>
                              <div className="text-sm font-medium text-purple-700">
                                {rd.duration} min
                              </div>
                            </div>

                            {/* Show station-specific partner assignments if modified */}
                            {hasStationModifiedPartners && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                                <div className="text-xs text-amber-700 font-medium mb-1">
                                  ✎ Partners modified for this station:
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {rd.groupIds?.map((gid) => {
                                    const stationGroup = rd.stationGroups?.[gid];
                                    if (!stationGroup) return null;
                                    return (
                                      <div key={gid} className="bg-white rounded px-2 py-1.5 text-xs">
                                        <div className="font-medium text-amber-800 mb-1">{stationGroup.name}</div>
                                        <ul className="text-gray-600 space-y-0.5">
                                          {stationGroup.playerIds.map((pid) => (
                                            <li key={pid}>• {players.find((p) => p.id === pid)?.name || 'Unknown'}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {stationDrill?.description && (
                              <div className="mt-2 text-xs text-purple-800 bg-purple-100 p-2 rounded whitespace-pre-wrap">
                                {stationDrill.description}
                              </div>
                            )}

                            {stationDrill?.videoUrl && (
                              <div className="mt-2">
                                <button
                                  onClick={() => setExpandedVideo(isStationVideoExpanded ? null : `${block.id}-${rdIndex}`)}
                                  className="inline-flex items-center text-xs text-purple-600 hover:text-purple-800"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {isStationVideoExpanded ? 'Hide Video' : 'Watch Video'}
                                </button>

                                {isStationVideoExpanded && stationEmbedInfo && (
                                  <div className="mt-2">
                                    {stationEmbedInfo.needsClickThrough ? (
                                      <a
                                        href={stationDrill.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                                      >
                                        Open Video
                                      </a>
                                    ) : stationEmbedInfo.type === 'direct' ? (
                                      <video
                                        src={stationEmbedInfo.embedUrl}
                                        controls
                                        className="w-full rounded aspect-video"
                                      />
                                    ) : (
                                      <iframe
                                        src={stationEmbedInfo.embedUrl}
                                        className="w-full rounded aspect-video"
                                        allowFullScreen
                                        title={stationDrill.title}
                                      />
                                    )}
                                    <a
                                      href={stationDrill.videoUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center mt-1 text-xs text-purple-600 hover:text-purple-800"
                                    >
                                      Open in new tab
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Video Player for Single Drills */}
                {isVideoExpanded && embedInfo && block.type === 'single' && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {embedInfo.needsClickThrough ? (
                      <div className="text-center">
                        <a
                          href={drill?.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open Video
                        </a>
                      </div>
                    ) : embedInfo.type === 'direct' ? (
                      <video
                        src={embedInfo.embedUrl}
                        controls
                        className="w-full rounded-lg aspect-video"
                      />
                    ) : (
                      <iframe
                        src={embedInfo.embedUrl}
                        className="w-full rounded-lg aspect-video"
                        allowFullScreen
                        title={drill?.title}
                      />
                    )}
                    <div className="text-center mt-2">
                      <a
                        href={drill?.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 bg-gold-400 rounded-full flex items-center justify-center">
              <span className="text-navy-900 font-black text-xs">GC</span>
            </div>
            <span className="text-sm text-gray-500">GC Falcons Practice Planner</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Our Lady of Good Counsel</p>
        </div>
      </div>
    </div>
  );
}
