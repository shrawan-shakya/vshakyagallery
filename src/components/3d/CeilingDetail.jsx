import React from 'react';
import { ROOM_H } from '../../constants';

const SIZE = 20;
const CELL = 2.5;

// Grid axes skipped here must stay in sync with the TubeLight rows in GalleryRoom
const TROUGH_Z = [-5, 0, 5];
const BAND_W = 0.42;
const BAND_D = 0.12;

// Cage ribs sit nearly flush with the ceiling and clear the tube housings
// (housing tops reach ROOM_H - 0.03)
const BEAM_W = 0.09;
const BEAM_D = 0.025;

// Quiet ceiling: softened perimeter band, whisper-faint cage grid, and slim
// recessed channels that carry the tube lights. The grid skips the tube-light
// rows, where the lit tubes carry their own line.
export default function CeilingDetail({ theme }) {
  const isDark = theme === 'dark';
  const bandColor = isDark ? '#17171f' : '#f0ece1';
  const beamColor = isDark ? '#20202b' : '#f6f3ea';

  const gridLines = [];
  for (let v = -SIZE / 2 + CELL; v <= SIZE / 2 - CELL + 0.01; v += CELL) {
    gridLines.push(+v.toFixed(2));
  }

  const yBand = ROOM_H - BAND_D / 2;
  // A hair below the ceiling plane so coplanar top faces never z-fight
  // against the band the ribs cross
  const yBeam = ROOM_H - BEAM_D / 2 - 0.001;
  const yBeamCross = yBeam - 0.002;

  const bandMat = (
    <meshStandardMaterial color={bandColor} roughness={0.96} metalness={0} envMapIntensity={0.2} />
  );
  const beamMat = (
    <meshStandardMaterial color={beamColor} roughness={1} metalness={0} envMapIntensity={0.12} />
  );

  return (
    <group>
      {/* Perimeter step band */}
      {[-1, 1].map((s) => (
        <mesh key={`band-x-${s}`} position={[s * (SIZE / 2 - BAND_W / 2), yBand, 0]}>
          <boxGeometry args={[BAND_W, BAND_D, SIZE]} />
          {bandMat}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`band-z-${s}`} position={[0, yBand, s * (SIZE / 2 - BAND_W / 2)]}>
          <boxGeometry args={[SIZE - 2 * BAND_W, BAND_D, BAND_W]} />
          {bandMat}
        </mesh>
      ))}

      {/* Faint cage grid */}
      {gridLines.map((v) => (
        <mesh key={`rib-x-${v}`} position={[v, yBeam, 0]}>
          <boxGeometry args={[BEAM_W, BEAM_D, SIZE - 2 * BAND_W]} />
          {beamMat}
        </mesh>
      ))}
      {gridLines
        .filter((v) => !TROUGH_Z.includes(v))
        .map((v) => (
          <mesh key={`rib-z-${v}`} position={[0, yBeamCross, v]}>
            <boxGeometry args={[SIZE - 2 * BAND_W, BEAM_D, BEAM_W]} />
            {beamMat}
          </mesh>
        ))}
    </group>
  );
}
