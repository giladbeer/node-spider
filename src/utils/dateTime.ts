export const formatDuration = (millis: number) => {
  let s = Math.floor(millis / 1000);
  let m = Math.floor(s / 60);
  const h = Math.floor(m / 60);

  s = s % 60;
  m = m % 60;
  return `${padLeft(h)}:${padLeft(m)}:${padLeft(s)}`;
};

const padLeft = (n: number) => (n < 10 ? `0${n}` : `${n}`);
