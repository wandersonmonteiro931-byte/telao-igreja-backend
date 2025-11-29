import {
  type User,
  type InsertLoginAttempt,
  type LoginAttempt,
  type Announcement,
  type InsertAnnouncement,
  type UserSettings,
  type SupportTicket,
  type InsertSupportTicket,
  type UpdateSupportTicket,
  type SupportTicketStatus
} from "../shared/schema.js";  // <-- corrigido

import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

// TODO resto do arquivo permanece igual !!!
