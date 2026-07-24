import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import { authController } from '../controllers/auth-controller'
import { miscController } from '../controllers/misc-controller'
import { cmsController } from '../controllers/cms-controller'
import { maturityController } from '../controllers/maturity-controller'
import { journeyController } from '../controllers/journey-controller'
import { authenticate } from '../middlewares/authenticate'
import { requireStaff } from '../middlewares/require-staff'
import { requireRole } from '../middlewares/require-role'
import { validate } from '../middlewares/validate'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../dtos/auth-dtos'
import {
  createProcessSchema,
  updateProcessSchema,
  saveDraftSchema,
  markAssessmentSchema,
  applicabilitySchema,
} from '../dtos/content-dtos'
import { saveObjectivesSchema, scorePainSchema } from '../dtos/journey-dtos'
import { isTest } from '../config/env'

export const routes = Router()

// Rate limit (constituição/app-architect): login e forgot. Alto em teste.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Muitas tentativas. Aguarde alguns minutos.' },
})
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Muitas tentativas. Aguarde alguns minutos.' },
})

// Públicas
routes.get('/health', miscController.health)
routes.get('/specialties', miscController.specialties)
routes.post('/auth/register', validate(registerSchema), authController.register)
routes.post('/auth/login', loginLimiter, validate(loginSchema), authController.login)
routes.post('/auth/refresh', authController.refresh)
routes.post('/auth/logout', authController.logout)
routes.post('/auth/forgot-password', forgotLimiter, validate(forgotPasswordSchema), authController.forgotPassword)
routes.post('/auth/reset-password', validate(resetPasswordSchema), authController.resetPassword)

// Protegidas
routes.get('/me', authenticate, authController.me)

// ---- Centro: catálogo publicado + Raio-X (Fatia 1) ----
routes.get('/processes', authenticate, maturityController.overview)
routes.get('/processes/:id', authenticate, maturityController.processDetail)
routes.put(
  '/assessments/:artifactId',
  authenticate,
  validate(markAssessmentSchema),
  maturityController.markAssessment,
)
routes.put(
  '/processes/:id/applicability',
  authenticate,
  requireRole('administrador', 'coordenador'),
  validate(applicabilitySchema),
  maturityController.setApplicability,
)
routes.get('/templates/:id/download', authenticate, maturityController.downloadTemplate)

// ---- Jornada gratuita (Fatia 2): objetivos, termômetro, fotografia ----
routes.get('/objectives', authenticate, journeyController.listObjectives)
routes.get('/me/objectives', authenticate, journeyController.getMyObjectives)
routes.put(
  '/me/objectives',
  authenticate,
  requireRole('administrador', 'coordenador'),
  validate(saveObjectivesSchema),
  journeyController.saveMyObjectives,
)
routes.get('/thermometer', authenticate, journeyController.thermometer)
routes.put(
  '/thermometer/:processId',
  authenticate,
  validate(scorePainSchema),
  journeyController.scorePain,
)
routes.get('/photo', authenticate, journeyController.photo)

// ---- CMS (backoffice — SÓ staff; CA-8/CA-9) ----
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
const cms = Router()
cms.use(authenticate, requireStaff)
cms.get('/lookups', cmsController.lookups)
cms.get('/processes', cmsController.listProcesses)
cms.post('/processes', validate(createProcessSchema), cmsController.createProcess)
cms.put('/processes/:id', validate(updateProcessSchema), cmsController.updateProcess)
cms.post('/processes/:id/draft', cmsController.createDraft)
cms.get('/versions/:id', cmsController.getVersion)
cms.put('/versions/:id', validate(saveDraftSchema), cmsController.saveDraft)
cms.post('/versions/:id/publish', cmsController.publish)
cms.post('/artifacts/:id/template', upload.single('file'), cmsController.uploadTemplate)
cms.delete('/templates/:id', cmsController.deleteTemplate)
routes.use('/cms', cms)
