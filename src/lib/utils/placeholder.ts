export const TAG_COLORS: Record<string, { bg: string; stroke: string }> = {
  default:          { bg: '#120e24', stroke: '#9b6ff0' },
  societa:          { bg: '#0e1a12', stroke: '#4a9e5c' },
  tecnologia:       { bg: '#060e18', stroke: '#2874a8' },
  'musica-antica':  { bg: '#1a0e06', stroke: '#c4622a' },
  ai:               { bg: '#120e24', stroke: '#9b6ff0' },
  programmazione:   { bg: '#060e18', stroke: '#2874a8' },
};

export const TAG_COLORS_LIGHT: Record<string, string> = {
  default:          '#f5f3fb',
  societa:          '#f3f8f4',
  tecnologia:       '#eef4f9',
  'musica-antica':  '#faf5f0',
  ai:               '#f5f3fb',
  programmazione:   '#eef4f9',
};

export const GRADIENT_COLORS: Record<string, { stop0: string; stop1: string }> = {
  default:          { stop0: '#1a1330', stop1: '#080610' },
  societa:          { stop0: '#1a2e1c', stop1: '#0a1209' },
  tecnologia:       { stop0: '#060e18', stop1: '#030810' },
  'musica-antica':  { stop0: '#1a0e06', stop1: '#0a0602' },
  ai:               { stop0: '#1a1330', stop1: '#080610' },
  programmazione:   { stop0: '#060e18', stop1: '#030810' },
};

export function hashSlug(slug: string): number {
  return slug.split('').reduce((acc, char, i) =>
    acc + char.charCodeAt(0) * (i + 1), 0
  );
}

export function getPlaceholderProps(slug: string) {
  const n = hashSlug(slug);
  return {
    layer1_shape:  n % 4,
    layer2_shape:  (n >> 2) % 4,
    layer3_shape:  (n >> 4) % 4,
    layers:        (n >> 6) % 2 + 2,
    rotation1:     n % 360,
    rotation2:     (n * 7) % 360,
    scale1:        (n % 40) + 60,
    scale2:        (n % 30) + 30,
    offsetX1:      (n % 60) - 30,
    offsetY1:      (n % 40) - 20,
    offsetX2:      ((n >> 3) % 60) - 30,
    offsetY2:      ((n >> 3) % 40) - 20,
    opacity1:      (n % 12) + 8,
    opacity2:      (n % 8) + 6,
    diag_angle:    (n % 80) - 40,
    grad_cx:       ((n % 40) + 40) + '%',
    grad_cy:       ((n % 30) + 30) + '%',
  };
}
