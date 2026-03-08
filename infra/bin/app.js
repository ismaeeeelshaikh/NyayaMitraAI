#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const security_stack_1 = require("../lib/security-stack");
const identity_stack_1 = require("../lib/identity-stack");
const data_stack_1 = require("../lib/data-stack");
const api_stack_1 = require("../lib/api-stack");
const ops_stack_1 = require("../lib/ops-stack");
const compute_stack_1 = require("../lib/compute-stack");
const app = new cdk.App();
const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-south-1' // Mumbai — India ke liye
};
// ORDER BAHUT IMPORTANT HAI — dependency chain hai
const security = new security_stack_1.SecurityStack(app, 'NyayaSecurityStack', { env });
const identity = new identity_stack_1.IdentityStack(app, 'NyayaIdentityStack', {
    env,
    kmsKey: security.kmsKey
});
const data = new data_stack_1.DataStack(app, 'NyayaDataStack', {
    env,
    kmsKey: security.kmsKey
});
const api = new api_stack_1.ApiStack(app, 'NyayaApiStack', {
    env,
    userPool: identity.userPool,
    userPoolClient: identity.userPoolClient
});
const compute = new compute_stack_1.ComputeStack(app, 'NyayaComputeStack', {
    env,
    tables: data.tables,
    buckets: data.buckets,
    httpApi: api.httpApi,
    webSocketApi: api.webSocketApi
});
new ops_stack_1.OpsStack(app, 'NyayaOpsStack', {
    env,
    httpApi: api.httpApi
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsMERBQXNEO0FBQ3RELDBEQUFzRDtBQUN0RCxrREFBOEM7QUFDOUMsZ0RBQTRDO0FBQzVDLGdEQUE0QztBQUM1Qyx3REFBb0Q7QUFFcEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsTUFBTSxHQUFHLEdBQUc7SUFDUixPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7SUFDeEMsTUFBTSxFQUFFLFlBQVksQ0FBRSx5QkFBeUI7Q0FDbEQsQ0FBQztBQUVGLG1EQUFtRDtBQUNuRCxNQUFNLFFBQVEsR0FBRyxJQUFJLDhCQUFhLENBQUMsR0FBRyxFQUFFLG9CQUFvQixFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUV2RSxNQUFNLFFBQVEsR0FBRyxJQUFJLDhCQUFhLENBQUMsR0FBRyxFQUFFLG9CQUFvQixFQUFFO0lBQzFELEdBQUc7SUFDSCxNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU07Q0FDMUIsQ0FBQyxDQUFDO0FBRUgsTUFBTSxJQUFJLEdBQUcsSUFBSSxzQkFBUyxDQUFDLEdBQUcsRUFBRSxnQkFBZ0IsRUFBRTtJQUM5QyxHQUFHO0lBQ0gsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNO0NBQzFCLENBQUMsQ0FBQztBQUVILE1BQU0sR0FBRyxHQUFHLElBQUksb0JBQVEsQ0FBQyxHQUFHLEVBQUUsZUFBZSxFQUFFO0lBQzNDLEdBQUc7SUFDSCxRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVE7SUFDM0IsY0FBYyxFQUFFLFFBQVEsQ0FBQyxjQUFjO0NBQzFDLENBQUMsQ0FBQztBQUVILE1BQU0sT0FBTyxHQUFHLElBQUksNEJBQVksQ0FBQyxHQUFHLEVBQUUsbUJBQW1CLEVBQUU7SUFDdkQsR0FBRztJQUNILE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtJQUNuQixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87SUFDckIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxPQUFPO0lBQ3BCLFlBQVksRUFBRSxHQUFHLENBQUMsWUFBWTtDQUNqQyxDQUFDLENBQUM7QUFFSCxJQUFJLG9CQUFRLENBQUMsR0FBRyxFQUFFLGVBQWUsRUFBRTtJQUMvQixHQUFHO0lBQ0gsT0FBTyxFQUFFLEdBQUcsQ0FBQyxPQUFPO0NBQ3ZCLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcclxuaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xyXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgeyBTZWN1cml0eVN0YWNrIH0gZnJvbSAnLi4vbGliL3NlY3VyaXR5LXN0YWNrJztcclxuaW1wb3J0IHsgSWRlbnRpdHlTdGFjayB9IGZyb20gJy4uL2xpYi9pZGVudGl0eS1zdGFjayc7XHJcbmltcG9ydCB7IERhdGFTdGFjayB9IGZyb20gJy4uL2xpYi9kYXRhLXN0YWNrJztcclxuaW1wb3J0IHsgQXBpU3RhY2sgfSBmcm9tICcuLi9saWIvYXBpLXN0YWNrJztcclxuaW1wb3J0IHsgT3BzU3RhY2sgfSBmcm9tICcuLi9saWIvb3BzLXN0YWNrJztcclxuaW1wb3J0IHsgQ29tcHV0ZVN0YWNrIH0gZnJvbSAnLi4vbGliL2NvbXB1dGUtc3RhY2snO1xyXG5cclxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcclxuXHJcbmNvbnN0IGVudiA9IHtcclxuICAgIGFjY291bnQ6IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQsXHJcbiAgICByZWdpb246ICdhcC1zb3V0aC0xJyAgLy8gTXVtYmFpIOKAlCBJbmRpYSBrZSBsaXllXHJcbn07XHJcblxyXG4vLyBPUkRFUiBCQUhVVCBJTVBPUlRBTlQgSEFJIOKAlCBkZXBlbmRlbmN5IGNoYWluIGhhaVxyXG5jb25zdCBzZWN1cml0eSA9IG5ldyBTZWN1cml0eVN0YWNrKGFwcCwgJ055YXlhU2VjdXJpdHlTdGFjaycsIHsgZW52IH0pO1xyXG5cclxuY29uc3QgaWRlbnRpdHkgPSBuZXcgSWRlbnRpdHlTdGFjayhhcHAsICdOeWF5YUlkZW50aXR5U3RhY2snLCB7XHJcbiAgICBlbnYsXHJcbiAgICBrbXNLZXk6IHNlY3VyaXR5Lmttc0tleVxyXG59KTtcclxuXHJcbmNvbnN0IGRhdGEgPSBuZXcgRGF0YVN0YWNrKGFwcCwgJ055YXlhRGF0YVN0YWNrJywge1xyXG4gICAgZW52LFxyXG4gICAga21zS2V5OiBzZWN1cml0eS5rbXNLZXlcclxufSk7XHJcblxyXG5jb25zdCBhcGkgPSBuZXcgQXBpU3RhY2soYXBwLCAnTnlheWFBcGlTdGFjaycsIHtcclxuICAgIGVudixcclxuICAgIHVzZXJQb29sOiBpZGVudGl0eS51c2VyUG9vbCxcclxuICAgIHVzZXJQb29sQ2xpZW50OiBpZGVudGl0eS51c2VyUG9vbENsaWVudFxyXG59KTtcclxuXHJcbmNvbnN0IGNvbXB1dGUgPSBuZXcgQ29tcHV0ZVN0YWNrKGFwcCwgJ055YXlhQ29tcHV0ZVN0YWNrJywge1xyXG4gICAgZW52LFxyXG4gICAgdGFibGVzOiBkYXRhLnRhYmxlcyxcclxuICAgIGJ1Y2tldHM6IGRhdGEuYnVja2V0cyxcclxuICAgIGh0dHBBcGk6IGFwaS5odHRwQXBpLFxyXG4gICAgd2ViU29ja2V0QXBpOiBhcGkud2ViU29ja2V0QXBpXHJcbn0pO1xyXG5cclxubmV3IE9wc1N0YWNrKGFwcCwgJ055YXlhT3BzU3RhY2snLCB7XHJcbiAgICBlbnYsXHJcbiAgICBodHRwQXBpOiBhcGkuaHR0cEFwaVxyXG59KTtcclxuXHJcbmFwcC5zeW50aCgpO1xyXG4iXX0=