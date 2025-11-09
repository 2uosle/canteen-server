// middleware/validation.js
// Input validation middleware using Joi

const Joi = require('joi');

/**
 * Middleware factory for validating request data
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Which property to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    // Note: Avoid logging request payloads here to prevent leaking sensitive data
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    // Replace request data with validated (and sanitized) data
    req[property] = value;
    next();
  };
}

// ===================================================================
// VALIDATION SCHEMAS
// ===================================================================

// -------------------------------------------------------------------
// Authentication Schemas
// -------------------------------------------------------------------

const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters'
    }),

  username: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9._!\-]{3,32}$/)
    .min(3)
    .max(32)
    .required()
    .messages({
      'string.empty': 'Username is required',
      'string.pattern.base': 'Username can only contain letters, numbers, dot (.), underscore (_), hyphen (-), and exclamation (!)',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 32 characters'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least 1 uppercase letter, 1 number, and 1 special character'
    }),

  role: Joi.string()
    .valid('student', 'staff', 'vendor', 'admin', 'canteen_manager')
    .default('student')
    .messages({
      'any.only': 'Role must be student, staff, vendor, admin, or canteen_manager'
    })
});

const loginSchema = Joi.object({
  username: Joi.string()
    .trim()
    .allow(''),

  name: Joi.string()
    .trim()
    .allow(''),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    })
}).or('username', 'name').messages({
  'object.missing': 'Either username or name is required'
});

// -------------------------------------------------------------------
// User Management Schemas
// -------------------------------------------------------------------

const addUserSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  username: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9._!\-]{3,32}$/)
    .min(3)
    .max(32)
    .allow(null)
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers, dot (.), underscore (_), hyphen (-), and exclamation (!)'
    }),

  rfid_uid: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[0-9A-F]+$/)
    .max(32)
    .allow(null)
    .messages({
      'string.pattern.base': 'RFID UID must contain only hexadecimal characters (0-9, A-F)'
    }),

  role: Joi.string()
    .valid('student', 'staff', 'vendor', 'admin', 'canteen_manager')
    .default('student'),

  balance: Joi.number()
    .min(0)
    .max(999999.99)
    .default(0)
    .messages({
      'number.min': 'Balance cannot be negative',
      'number.max': 'Balance exceeds maximum allowed'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).*$/)
    .allow(null)
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter and one special character'
    })
});

// -------------------------------------------------------------------
// Transaction Schemas
// -------------------------------------------------------------------

const reloadSchema = Joi.object({
  rfid_uid: Joi.string()
    .trim()
    .uppercase()
    .required()
    .messages({
      'string.empty': 'RFID UID is required'
    }),

  amount: Joi.number()
    .positive()
    .max(10000)
    .precision(2)
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'number.max': 'Amount cannot exceed 10,000',
      'any.required': 'Amount is required'
    })
});

const transactionSchema = Joi.object({
  uid: Joi.string()
    .trim()
    .uppercase()
    .required()
    .messages({
      'string.empty': 'RFID UID is required'
    }),

  item_id: Joi.number()
    .integer()
    .positive()
    .allow(null),

  amount: Joi.number()
    .positive()
    .max(10000)
    .precision(2)
    .when('item_id', {
      is: null,
      then: Joi.required()
    })
    .messages({
      'number.positive': 'Amount must be positive',
      'number.max': 'Amount cannot exceed 10,000'
    }),

  device_id: Joi.string()
    .trim()
    .max(50)
    .allow(null)
}).or('item_id', 'amount').messages({
  'object.missing': 'Either item_id or amount is required'
});

const pendingSaleSchema = Joi.object({
  item_id: Joi.number()
    .integer()
    .positive()
    .allow(null),

  item_name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .when('item_id', {
      is: null,
      then: Joi.required()
    }),

  amount: Joi.number()
    .positive()
    .max(10000)
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    })
});

const confirmPendingSchema = Joi.object({
  pending_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Pending ID is required'
    }),

  uid: Joi.string()
    .trim()
    .uppercase()
    .required()
    .messages({
      'string.empty': 'RFID UID is required'
    }),

  device_id: Joi.string()
    .trim()
    .max(50)
    .allow(null)
});

// -------------------------------------------------------------------
// RFID Pairing Schemas
// -------------------------------------------------------------------

const rfidLinkStartSchema = Joi.object({
  user_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'User ID is required',
      'number.base': 'User ID must be a number'
    }),

  override: Joi.boolean()
    .default(false)
});

const rfidLinkConfirmSchema = Joi.object({
  pending_id: Joi.number()
    .integer()
    .positive()
    .required(),

  uid: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[0-9A-F]+$/)
    .required()
    .messages({
      'string.pattern.base': 'RFID UID must contain only hexadecimal characters'
    }),

  device_id: Joi.string()
    .trim()
    .max(50)
    .allow(null)
});

const rfidUnlinkSchema = Joi.object({
  user_id: Joi.number()
    .integer()
    .positive()
    .required()
});

// -------------------------------------------------------------------
// Student Self-Service Schemas
// -------------------------------------------------------------------

const changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required'
    }),

  new_password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).*$/)
    .required()
    .invalid(Joi.ref('current_password'))
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.max': 'New password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter and one special character',
      'any.invalid': 'New password must be different from current password',
      'string.empty': 'New password is required'
    })
});

// -------------------------------------------------------------------
// Report/Query Schemas
// -------------------------------------------------------------------

const reportQuerySchema = Joi.object({
  from: Joi.date()
    .iso()
    .max('now')
    .allow(''),

  to: Joi.date()
    .iso()
    .min(Joi.ref('from'))
    .max('now')
    .allow('')
    .messages({
      'date.min': '"to" date must be after "from" date',
      'date.max': '"to" date cannot be in the future'
    })
});

const balanceParamSchema = Joi.object({
  uid: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[0-9A-F]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid RFID UID format'
    })
});

const statusParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID must be a number'
    })
});

// -------------------------------------------------------------------
// Cart/Order Schemas
// -------------------------------------------------------------------

const createOrderSchema = Joi.object({
  device_id: Joi.string()
    .trim()
    .max(64)
    .allow(null, '')
});

const addOrderItemSchema = Joi.object({
  item_id: Joi.number()
    .integer()
    .positive()
    .allow(null),

  custom_item: Joi.string()
    .trim()
    .min(1)
    .max(150)
    .when('item_id', {
      is: null,
      then: Joi.required()
    }),

  price: Joi.number()
    .positive()
    .max(10000)
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Price must be positive',
      'any.required': 'Price is required'
    }),

  qty: Joi.number()
    .integer()
    .positive()
    .max(100)
    .default(1)
    .messages({
      'number.positive': 'Quantity must be positive',
      'number.max': 'Quantity cannot exceed 100'
    })
});

const updateOrderItemSchema = Joi.object({
  qty: Joi.number()
    .integer()
    .positive()
    .max(100)
    .required()
    .messages({
      'number.positive': 'Quantity must be positive',
      'number.max': 'Quantity cannot exceed 100',
      'any.required': 'Quantity is required'
    })
});

const orderIdParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Order ID is required',
      'number.base': 'Order ID must be a number'
    })
});

// ===================================================================
// EXPORTS
// ===================================================================

module.exports = {
  validate,
  
  // Authentication
  registerSchema,
  loginSchema,
  
  // User Management
  addUserSchema,
  
  // Transactions
  reloadSchema,
  transactionSchema,
  pendingSaleSchema,
  confirmPendingSchema,
  
  // RFID
  rfidLinkStartSchema,
  rfidLinkConfirmSchema,
  rfidUnlinkSchema,
  
  // Student
  changePasswordSchema,
  
  // Reports/Queries
  reportQuerySchema,
  balanceParamSchema,
  statusParamSchema,
  
  // Cart/Orders
  createOrderSchema,
  addOrderItemSchema,
  updateOrderItemSchema,
  orderIdParamSchema
};

