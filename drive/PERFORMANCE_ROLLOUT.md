# 3D driving performance rollout and validation gates

The `drive/` client is a React Three Fiber/Rapier application with two driving modes. Do not use the headless mission scripts as a proxy for either GPU performance or vehicle handling.

## Changes that can be evaluated now

- The controller advances before each fixed Rapier step; the vehicle pose and Quiet Roads mission sample are published after that step.
- Spatial triggers detect center-line crossings between steps, while placement resets the crossing origin. The authored trigger count is small; an AABB tree has not been introduced.
- Quiet Roads facts generated inside a simulation step are delivered in a bounded, ordered post-step drain. Events originating outside the simulation step drain immediately, with nested events queued rather than delivered recursively.
- Highway road tiles are rendered as an instance batch for each GLB submesh and chunk. The current `road-straight.glb` contains one mesh and one primitive; compare draw calls and appearance against the previous build.
- The Kent navigation canvas skips unchanged position/heading/route/layout samples; Quiet billboards skip unchanged matrix uploads; the camera provides a small continuous drift offset after measured lateral slip exceeds 0.15 at speed.

## Browser acceptance checks (not covered by the scripts)

1. In Kent, drive and walk every available act. Confirm scene changes, quizzes, stop grading, school speed limits, teleports, and subtitle order. Test both 30 Hz and high-refresh rendering where available.
2. On the highway, inspect the road at chunk boundaries from each camera mode. Confirm correct texture orientation, no missing tiles after recycling, and no increase in GPU memory after repeated chunk transitions.
3. Open the client with `?profileDrive` and read `window.__drivePerf()` in the console. Compare p50/p95/p99 `frameMs`, `vehicleMs`, `missionMs`, `previousDrawCalls`, and `previousTriangles` on the same device/scene/settings against a pre-change build. The draw counters are sampled before the current render and refer to the preceding rendered frame. This is not a GPU timing measurement.
4. Verify drift shake is subtle and does not obscure signs, captions, or the stopping shadow. Confirm the Kent skid teaching threshold and 10 Hz Quiet HUD are unchanged.

## Open engineering work

The car still uses programmatic linear/angular velocity and a decorative wheel rig. `getPacejkaForce` and `getSlipRatio` are not yet wired into Rapier contacts; per-wheel spring/damper forces and load transfer are not implemented. Replacing the drive model requires four contact probes, calibrated wheel torque and RPM units, combined-slip force limits, suspension travel and ground/air handling, explicit hold/restore behavior, and a measurement-backed stopping-distance contract for each chassis and surface. Do not mix per-wheel forces into the current `setLinvel` model: it would overwrite the forces and destabilize the existing educational stopping lessons. Kent world geometry batching and GPU postprocessing quality tiers likewise require browser baselines before selecting the next change.

## Automated verification

From the repository root, run the client type-check using `drive/node_modules/.bin/tsc --project drive/tsconfig.json --noEmit` and the client build from `drive/` using `npm run build` (the build writes under `public/game/drive`). Headless mission scripts in `drive/scripts/*test.mts` use TypeScript imports; bundle each with the installed esbuild CLI before running it with Node if no TypeScript runner is installed.