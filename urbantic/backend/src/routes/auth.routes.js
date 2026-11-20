const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');
const {
  validate,
  registerSchema,
  loginSchema,
  passwordRecoveryIdentitySchema,
  passwordRecoveryResetSchema,
  profileSchema
} = require('../middleware/validate.middleware');

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/password-recovery/verify', validate(passwordRecoveryIdentitySchema), authController.verifyPasswordRecoveryIdentity);
router.post('/password-recovery/reset', validate(passwordRecoveryResetSchema), authController.resetPassword);
router.get('/me', authenticate, authController.me);
router.put('/profile', authenticate, validate(profileSchema), authController.updateProfile);

module.exports = router;
