// src/app.ts
import express, { json, urlencoded } from 'express';
import { RegisterRoutes } from '../build/routes';
import cors from 'cors';

export const app = express();

// Use body parser to read sent json payloads
app.use(
    urlencoded({
        extended: true
    })
);
app.use(json());
app.use(cors());

RegisterRoutes(app);
