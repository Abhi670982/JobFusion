// Core contracts and registry
export * from "./BaseAdapter";
export * from "./AbstractAdapter";
export * from "./AdapterRegistry";

// Concrete adapters (side-effect imports trigger AdapterRegistry.register)
import "./WorkdayAdapter";
import "./GreenhouseAdapter";
import "./LeverAdapter";
import "./AshbyAdapter";
import "./SmartRecruitersAdapter";
import "./RecruiteeAdapter";

export { WorkdayAdapter } from "./WorkdayAdapter";
export { GreenhouseAdapter } from "./GreenhouseAdapter";
export { LeverAdapter } from "./LeverAdapter";
export { AshbyAdapter } from "./AshbyAdapter";
export { SmartRecruitersAdapter } from "./SmartRecruitersAdapter";
export { RecruiteeAdapter } from "./RecruiteeAdapter";
