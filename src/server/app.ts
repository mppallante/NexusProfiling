import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import {
  buildSourcesWithState,
  createCase,
  getCase,
  listCases,
  seedDemoData,
  updateBehavioralProfile,
  updateLegalChecklist
} from '../database/db';
import { sourceCatalog } from '../connectors';
import { runOsint } from '../services/osintService';
import { buildCaseReportHtml } from '../services/reportService';
import type { OsintInputType } from '../types/domain';

const osintSchema = z.object({
  caseId: z.string().min(1),
  type: z.enum(['cnpj', 'cep', 'domain', 'email', 'username']),
  input: z.string().min(2)
});

export function createApp() {
  seedDemoData();

  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', name: 'NexusProfiling', localOnly: true });
  });

  app.get('/api/osint-sources', (_request, response) => {
    response.json(buildSourcesWithState(sourceCatalog));
  });

  app.get('/api/cases', (_request, response) => {
    response.json(listCases());
  });

  app.post('/api/cases', (request, response, next) => {
    try {
      const body = z.object({ title: z.string().min(3), summary: z.string().default('') }).parse(request.body);
      response.status(201).json(createCase(body));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/cases/:caseId', (request, response) => {
    const caseDetail = getCase(request.params.caseId);
    if (!caseDetail) {
      response.status(404).json({ error: 'Caso não encontrado.' });
      return;
    }
    response.json(caseDetail);
  });

  app.put('/api/cases/:caseId/profile', (request, response, next) => {
    try {
      const caseDetail = getCase(request.params.caseId);
      if (!caseDetail) {
        response.status(404).json({ error: 'Caso não encontrado.' });
        return;
      }
      updateBehavioralProfile(request.params.caseId, request.body);
      response.json(getCase(request.params.caseId));
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/cases/:caseId/checklist', (request, response, next) => {
    try {
      const caseDetail = getCase(request.params.caseId);
      if (!caseDetail) {
        response.status(404).json({ error: 'Caso não encontrado.' });
        return;
      }
      updateLegalChecklist(request.params.caseId, request.body);
      response.json(getCase(request.params.caseId));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/osint/run', async (request, response, next) => {
    try {
      const body = osintSchema.parse(request.body) as { caseId: string; type: OsintInputType; input: string };
      response.json(await runOsint(body));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/cases/:caseId/report.html', (request, response) => {
    const caseDetail = getCase(request.params.caseId);
    if (!caseDetail) {
      response.status(404).send('Caso não encontrado.');
      return;
    }
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.send(buildCaseReportHtml(caseDetail));
  });

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : 'Erro interno.';
    response.status(400).json({ error: message });
  });

  return app;
}

export function startServer(port = Number(process.env.PORT ?? 3333), host = '127.0.0.1') {
  const app = createApp();
  const server = app.listen(port, host, () => {
    console.log(`NexusProfiling API em http://${host}:${port}`);
  });

  return { app, server, port, host };
}
