'use client';

import { useCallback, useRef, useState } from 'react';

// Drag-and-drop walk rating.
//
// RateWalkChip is the drag source: a floating "Rate your walk" chip on
// the map. It uses pointer events (not HTML5 drag-and-drop, which never
// fires on touch screens) — press, drag the star ghost to where you
// walked, release. The drop point is converted to lat/lon through the
// live Leaflet instance and handed to the parent, which opens RatingForm.

export function RateWalkChip({ mapPaneRef, getMap, onDrop }) {
  const [dragging, setDragging] = useState(false);
  const [ghost, setGhost] = useState({ x: 0, y: 0 });
  const activePointer = useRef(null);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    activePointer.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setGhost({ x: e.clientX, y: e.clientY });
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragging || e.pointerId !== activePointer.current) return;
      setGhost({ x: e.clientX, y: e.clientY });
    },
    [dragging]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (!dragging || e.pointerId !== activePointer.current) return;
      setDragging(false);
      activePointer.current = null;

      const pane = mapPaneRef.current;
      const map = getMap();
      if (!pane || !map) return;

      const rect = pane.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inside) return; // dropped outside the map — cancel quietly

      const latlng = map.containerPointToLatLng([
        e.clientX - rect.left,
        e.clientY - rect.top,
      ]);
      onDrop({ lat: latlng.lat, lon: latlng.lng });
    },
    [dragging, mapPaneRef, getMap, onDrop]
  );

  return (
    <>
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Drag the star onto the map to rate a walk"
        className="absolute top-3 right-3 z-[500] flex items-center gap-1.5 glass-panel border border-outline-variant/30 breathable-shadow rounded-full px-3 py-2 text-label-md font-label-md text-on-surface cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'none' }}
      >
        <span
          className="material-symbols-outlined text-[18px] text-[#f9a825]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
        Rate your walk
      </button>

      {dragging && (
        <div
          className="fixed z-[9999] pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: ghost.x, top: ghost.y }}
        >
          <span
            className="material-symbols-outlined text-[36px] text-[#f9a825] drop-shadow-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
        </div>
      )}
    </>
  );
}

// Modal star-picker + comment form for a freshly dropped pin.
export function RatingForm({ draft, onCancel, onSubmit, submitting }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  if (!draft) return null;

  return (
    <div className="absolute inset-0 z-[600] flex items-center justify-center bg-inverse-surface/30 p-4">
      <div className="bg-surface-container-lowest rounded-xl breathable-shadow border border-outline-variant/30 p-card-padding w-full max-w-sm">
        <h3 className="font-headline-md text-headline-md text-on-surface m-0 mb-1">
          Rate this walk
        </h3>
        <p className="text-label-sm font-label-sm text-on-surface-variant mt-0 mb-4">
          How was the air along your walk here? Your pin stays visible to
          everyone for 24 hours.
        </p>

        <div className="flex justify-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className="p-1 transition-transform active:scale-90"
            >
              <span
                className={`material-symbols-outlined text-[32px] ${
                  n <= stars ? 'text-[#f9a825]' : 'text-outline-variant'
                }`}
                style={{ fontVariationSettings: n <= stars ? "'FILL' 1" : "'FILL' 0" }}
              >
                star
              </span>
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="Optional comment — smells, traffic, shade, how it felt…"
          className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/70 border border-secondary-container/50 rounded-lg text-body-md font-body-md p-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
        />
        <div className="text-right text-label-sm font-label-sm text-on-surface-variant mb-3">
          {comment.length}/500
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-outline-variant/50 text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={stars === 0 || submitting}
            onClick={() => onSubmit({ rating: stars, comment })}
            className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting…' : 'Post rating'}
          </button>
        </div>
      </div>
    </div>
  );
}
