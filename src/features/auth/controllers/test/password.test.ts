import { Request, Response } from "express";
import { Password } from "@auth/controllers/password";
import {
  authMock,
  authMockRequest,
  authMockResponse,
} from "@root/mocks/auth.mock";
import { CustomError } from "@global/helpers/error-handler";
import { emailQueue } from "@service/queues/email-queue";
import { authService } from "@service/db/auth-service";

const WRONG_EMAIL = "test@email.com";
const CORRECT_EMAIL = "manny@me.com";
const INVALID_EMAIL = "test";
const CORRECT_PASSWORD = "manny";

jest.mock("@service/queues/base-queue");
jest.mock("@service/queues/email-queue");
jest.mock("@service/db/auth-service");
jest.mock("@service/email/mail-transport");

describe("Password", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should throw an error if email is invalid", () => {
      const req: Request = authMockRequest(
        {},
        { email: INVALID_EMAIL }
      ) as Request;
      const res: Response = authMockResponse();
      Password.prototype.resetPassword(req, res).catch((error: CustomError) => {
        expect(error.statusCode).toEqual(400);
        expect(error.serializeErrors().message).toEqual("Field must be valid");
      });
    });

    it('should throw "User does not exist!" if email does not exist', () => {
      const req: Request = authMockRequest(
        {},
        { email: WRONG_EMAIL }
      ) as Request;
      const res: Response = authMockResponse();
      jest
        .spyOn(authService, "getAuthUserByEmail")
        .mockResolvedValue(null as any);
      Password.prototype.resetPassword(req, res).catch((error: CustomError) => {
        expect(error.statusCode).toEqual(400);
        expect(error.serializeErrors().message).toEqual("User does not exist!");
      });
    });

    it("should send correct json response", async () => {
      const req: Request = authMockRequest(
        {},
        { email: CORRECT_EMAIL }
      ) as Request;
      const res: Response = authMockResponse();
      jest.spyOn(authService, "getAuthUserByEmail").mockResolvedValue(authMock);
      jest.spyOn(emailQueue, "addEmailJob");
      await Password.prototype.resetPassword(req, res);
      expect(emailQueue.addEmailJob).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Reset email sent successfully",
      });
    });
  });

  describe("update", () => {
    it("should throw an error if password is empty", () => {
      const req: Request = authMockRequest({}, { password: "" }) as Request;
      const res: Response = authMockResponse();
      Password.prototype
        .updatePassword(req, res)
        .catch((error: CustomError) => {
          expect(error.statusCode).toEqual(400);
          expect(error.serializeErrors().message).toEqual(
            "Password is a required field"
          );
        });
    });

    it("should throw an error if password and confirmPassword are different", () => {
      const req: Request = authMockRequest(
        {},
        { password: CORRECT_PASSWORD, confirmPassword: `${CORRECT_PASSWORD}2` }
      ) as Request;
      const res: Response = authMockResponse();
      Password.prototype
        .updatePassword(req, res)
        .catch((error: CustomError) => {
          expect(error.statusCode).toEqual(400);
          expect(error.serializeErrors().message).toEqual(
            "Passwords should match"
          );
        });
    });

    it("should throw error if reset token has expired", () => {
      const req: Request = authMockRequest(
        {},
        { password: CORRECT_PASSWORD, confirmPassword: CORRECT_PASSWORD },
        null,
        {
          token: "",
        }
      ) as Request;
      const res: Response = authMockResponse();
      jest
        .spyOn(authService, "getAuthUserByToken")
        .mockResolvedValue(null as any);
      Password.prototype
        .updatePassword(req, res)
        .catch((error: CustomError) => {
          expect(error.statusCode).toEqual(400);
          expect(error.serializeErrors().message).toEqual("Invalid token");
        });
    });

    it("should send correct json response", async () => {
      const req: Request = authMockRequest(
        {},
        { password: CORRECT_PASSWORD, confirmPassword: CORRECT_PASSWORD },
        null,
        {
          token: "12sde3",
        }
      ) as Request;
      const res: Response = authMockResponse();
      jest.spyOn(authService, "getAuthUserByToken").mockResolvedValue(authMock);
      jest.spyOn(emailQueue, "addEmailJob");
      await Password.prototype.updatePassword(req, res);
      expect(emailQueue.addEmailJob).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Password successfully updated.",
      });
    });
  });
});
