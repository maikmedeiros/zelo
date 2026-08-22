import express from 'express';

export const bodyParserJson = express.json({ limit: '1mb' });
export const bodyParserUrlencoded = express.urlencoded({ extended: true, limit: '1mb' });
export const bodyParserRaw = express.raw({ limit: '1mb' });
