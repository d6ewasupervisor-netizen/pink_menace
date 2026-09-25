import assert from "node:assert/strict";
import { CHASSIS_DECEL, VEHICLE, brakeDecel, stoppingDistanceM } from "../src/quietroads/sim/vehicleObserver";

const v = 20;
const beetle = stoppingDistanceM(v, VEHICLE.MU.dry, CHASSIS_DECEL.beetle);
const highway = stoppingDistanceM(v, VEHICLE.MU.dry, CHASSIS_DECEL.highway);
const truck = stoppingDistanceM(v, VEHICLE.MU.dry, CHASSIS_DECEL.truck);
const ice = stoppingDistanceM(v, VEHICLE.MU.ice, CHASSIS_DECEL.highway);

assert.ok(highway > beetle, `${highway} should outrun ${beetle}`);
assert.ok(truck > highway, `${truck} should outrun ${highway}`);
assert.ok(ice > truck, `${ice} should outrun ${truck}`);
assert.equal(brakeDecel("truck", VEHICLE.MU.dry), CHASSIS_DECEL.truck);
assert.ok(brakeDecel("beetle", VEHICLE.MU.ice) < 2);

console.log("stopping distance ok", { beetle: beetle.toFixed(1), highway: highway.toFixed(1), truck: truck.toFixed(1), ice: ice.toFixed(1) });
