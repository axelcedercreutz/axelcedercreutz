// Vercel Function: GET issues a form token, POST accepts a message. All logic is in _contact-core.js
// (the underscore keeps Vercel from deploying that file as a function of its own).
import { handlerFromEnv } from "./_contact-core.js";

const handler = handlerFromEnv();
export const GET = () => handler.GET();
export const POST = (request) => handler.POST(request);
