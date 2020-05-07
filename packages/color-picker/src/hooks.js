import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { hslToRgb, rgbToHsl, hslToHsv, hsvToHsl, rgbToHex, hexToRgb, isHex } from './color-convert';

export function useMappingUpdate(v, setV, mapIn = x => x, mapOut = (_, x) => x) {
	const mappedSet = useRef();
	mappedSet.current = update => {
		if (update instanceof Function) {
			setV(mapOut(v, update(mapIn(v))));
		} else {
			setV(mapOut(v, update));
		}
	};
	return useCallback(callback => mappedSet.current(callback), []);
}

export const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
function calcPosition(elem, item) {
	const rect = elem.getBoundingClientRect();
	const w = rect.right - rect.left;
	const h = rect.bottom - rect.top;
	const x = item.clientX - rect.left;
	const y = item.clientY - rect.top;
	return { x: clamp(x / w, 0, 1), y: clamp(y / h, 0, 1) };
}

export function useSlider(onChange) {
	const ref = useRef();
	const isClicking = useRef(false);

	const onMouseDown = useCallback(
		event => {
			if (event.button === 0) {
				event.preventDefault();
				isClicking.current = true;
				onChange(() => calcPosition(ref.current, event));
			}
		},
		[onChange]
	);

	const onTouchStart = useCallback(
		event => {
			event.preventDefault();
			isClicking.current = true;
			onChange(() => calcPosition(ref.current, event.touches[0]));
		},
		[onChange]
	);

	const onDragStart = useCallback(event => event.preventDefault(), []);

	const onKeyDown = useCallback(
		event => {
			if (event.key === 'ArrowUp') {
				onChange(v => ({ x: v.x, y: Math.max(v.y - 0.01, 0) }));
			} else if (event.key === 'ArrowDown') {
				onChange(v => ({ x: v.x, y: Math.min(v.y + 0.01, 1) }));
			} else if (event.key === 'ArrowLeft') {
				onChange(v => ({ x: Math.max(v.x - 0.01, 0), y: v.y }));
			} else if (event.key === 'ArrowRight') {
				onChange(v => ({ x: Math.min(v.x + 0.01, 1), y: v.y }));
			}
		},
		[onChange]
	);

	useEffect(() => {
		function onMouseMove(event) {
			if (isClicking.current) {
				if (event.buttons === 0) {
					isClicking.current = false;
				} else {
					event.preventDefault();
					onChange(() => calcPosition(ref.current, event));
				}
			}
		}
		function onTouchMove(event) {
			if (isClicking.current) {
				event.preventDefault();
				onChange(() => calcPosition(ref.current, event.touches[0]));
			}
		}
		function onTouchEnd(event) {
			if (event.touches.length === 0) {
				isClicking.current = false;
			}
		}

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('touchmove', onTouchMove);
		document.addEventListener('touchend', onTouchEnd);
		return () => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('touchmove', onTouchMove);
			document.removeEventListener('touchend', onTouchEnd);
		};
	}, [onChange]);

	return { ref, onMouseDown, onTouchStart, onDragStart, onKeyDown, tabIndex: 0 };
}

function toHsl(color) {
	if (typeof color === 'string' && isHex(color)) {
		return rgbToHsl(hexToRgb(color));
	}

	if (color.r != null) {
		return rgbToHsl(color);
	}

	if (color.h != null) {
		if (color.v) {
			return hsvToHsl(color);
		}

		return color;
	}

	return { h: 0, s: 0, l: 0, a: 1 };
}
export function useColor(initialColor) {
	const [hsl, setHsl] = useState(() => toHsl(initialColor));

	const color = useMemo(() => {
		const hsv = hslToHsv(hsl);
		const rgb = hslToRgb(hsl);
		const hex = rgbToHex(rgb);
		return { hsl, hsv, rgb, hex };
	}, [hsl]);

	const set = useMemo(() => {
		const set = color => setHsl(toHsl(color));
		set.hsl = setHsl;
		set.hsv = c => setHsl(hsvToHsl(c));
		set.rgb = c => setHsl(rgbToHsl(c));
		set.hex = c => setHsl(rgbToHsl(hexToRgb(c)));

		return set;
	}, []);

	return [color, set];
}
