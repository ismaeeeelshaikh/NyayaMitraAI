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
new ops_stack_1.OpsStack(app, 'NyayaOpsStack', {
    env,
    httpApi: api.httpApi
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsMERBQXNEO0FBQ3RELDBEQUFzRDtBQUN0RCxrREFBOEM7QUFDOUMsZ0RBQTRDO0FBQzVDLGdEQUE0QztBQUU1QyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixNQUFNLEdBQUcsR0FBRztJQUNSLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtJQUN4QyxNQUFNLEVBQUUsWUFBWSxDQUFFLHlCQUF5QjtDQUNsRCxDQUFDO0FBRUYsbURBQW1EO0FBQ25ELE1BQU0sUUFBUSxHQUFHLElBQUksOEJBQWEsQ0FBQyxHQUFHLEVBQUUsb0JBQW9CLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBRXZFLE1BQU0sUUFBUSxHQUFHLElBQUksOEJBQWEsQ0FBQyxHQUFHLEVBQUUsb0JBQW9CLEVBQUU7SUFDMUQsR0FBRztJQUNILE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTTtDQUMxQixDQUFDLENBQUM7QUFFSCxNQUFNLElBQUksR0FBRyxJQUFJLHNCQUFTLENBQUMsR0FBRyxFQUFFLGdCQUFnQixFQUFFO0lBQzlDLEdBQUc7SUFDSCxNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU07Q0FDMUIsQ0FBQyxDQUFDO0FBRUgsTUFBTSxHQUFHLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEdBQUcsRUFBRSxlQUFlLEVBQUU7SUFDM0MsR0FBRztJQUNILFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUTtJQUMzQixjQUFjLEVBQUUsUUFBUSxDQUFDLGNBQWM7Q0FDMUMsQ0FBQyxDQUFDO0FBRUgsSUFBSSxvQkFBUSxDQUFDLEdBQUcsRUFBRSxlQUFlLEVBQUU7SUFDL0IsR0FBRztJQUNILE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTztDQUN2QixDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXHJcbmltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcclxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0IHsgU2VjdXJpdHlTdGFjayB9IGZyb20gJy4uL2xpYi9zZWN1cml0eS1zdGFjayc7XHJcbmltcG9ydCB7IElkZW50aXR5U3RhY2sgfSBmcm9tICcuLi9saWIvaWRlbnRpdHktc3RhY2snO1xyXG5pbXBvcnQgeyBEYXRhU3RhY2sgfSBmcm9tICcuLi9saWIvZGF0YS1zdGFjayc7XHJcbmltcG9ydCB7IEFwaVN0YWNrIH0gZnJvbSAnLi4vbGliL2FwaS1zdGFjayc7XHJcbmltcG9ydCB7IE9wc1N0YWNrIH0gZnJvbSAnLi4vbGliL29wcy1zdGFjayc7XHJcblxyXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xyXG5cclxuY29uc3QgZW52ID0ge1xyXG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcclxuICAgIHJlZ2lvbjogJ2FwLXNvdXRoLTEnICAvLyBNdW1iYWkg4oCUIEluZGlhIGtlIGxpeWVcclxufTtcclxuXHJcbi8vIE9SREVSIEJBSFVUIElNUE9SVEFOVCBIQUkg4oCUIGRlcGVuZGVuY3kgY2hhaW4gaGFpXHJcbmNvbnN0IHNlY3VyaXR5ID0gbmV3IFNlY3VyaXR5U3RhY2soYXBwLCAnTnlheWFTZWN1cml0eVN0YWNrJywgeyBlbnYgfSk7XHJcblxyXG5jb25zdCBpZGVudGl0eSA9IG5ldyBJZGVudGl0eVN0YWNrKGFwcCwgJ055YXlhSWRlbnRpdHlTdGFjaycsIHtcclxuICAgIGVudixcclxuICAgIGttc0tleTogc2VjdXJpdHkua21zS2V5XHJcbn0pO1xyXG5cclxuY29uc3QgZGF0YSA9IG5ldyBEYXRhU3RhY2soYXBwLCAnTnlheWFEYXRhU3RhY2snLCB7XHJcbiAgICBlbnYsXHJcbiAgICBrbXNLZXk6IHNlY3VyaXR5Lmttc0tleVxyXG59KTtcclxuXHJcbmNvbnN0IGFwaSA9IG5ldyBBcGlTdGFjayhhcHAsICdOeWF5YUFwaVN0YWNrJywge1xyXG4gICAgZW52LFxyXG4gICAgdXNlclBvb2w6IGlkZW50aXR5LnVzZXJQb29sLFxyXG4gICAgdXNlclBvb2xDbGllbnQ6IGlkZW50aXR5LnVzZXJQb29sQ2xpZW50XHJcbn0pO1xyXG5cclxubmV3IE9wc1N0YWNrKGFwcCwgJ055YXlhT3BzU3RhY2snLCB7XHJcbiAgICBlbnYsXHJcbiAgICBodHRwQXBpOiBhcGkuaHR0cEFwaVxyXG59KTtcclxuXHJcbmFwcC5zeW50aCgpO1xyXG4iXX0=