import assert from "node:assert/strict";
import test from "node:test";
import {
  loginSchema,
  signupSchema,
} from "../../src/features/auth/schemas/auth-schema";
import {
  getAuthFailure,
  getLoginDestination,
} from "../../src/features/auth/utils/auth-feedback";
test("auth schemas share email normalization, emit one issue per field, and preserve passwords", () => {
  for (const schema of [loginSchema, signupSchema]) {
    const invalid = schema.safeParse({
      name: "고객",
      email: " ",
      password: "",
    });
    assert(!invalid.success);
    assert.equal(
      invalid.error.issues.filter((issue) => issue.path[0] === "email").length,
      1,
    );
    assert.equal(
      invalid.error.issues.filter((issue) => issue.path[0] === "password")
        .length,
      1,
    );
    assert(
      !schema.safeParse({ name: "고객", email: "name@", password: "12345678" })
        .success,
    );
  }
  assert.deepEqual(
    signupSchema.parse({
      name: " 고객 ",
      email: " name@example.com ",
      password: " password ",
    }),
    { name: "고객", email: "name@example.com", password: " password " },
  );
  assert(
    loginSchema.safeParse({ email: "name@example.com", password: "short" })
      .success,
  );
  assert(
    !signupSchema.safeParse({
      name: "고객",
      email: "name@example.com",
      password: "short",
    }).success,
  );
});
test("auth failures have one destination and distinguish credentials, signup duplicates and rate limits", () => {
  assert.equal(
    getAuthFailure({ code: "user_already_exists" }, "signup").field,
    "email",
  );
  assert.equal(
    getAuthFailure({ code: "weak_password" }, "signup").field,
    "password",
  );
  assert.equal(
    getAuthFailure({ code: "invalid_credentials" }, "login").field,
    "root.server",
  );
  assert.equal(
    getAuthFailure({ status: 429, message: "password rate limit" }, "signup")
      .field,
    "root.server",
  );
});
test("login redirect accepts internal paths and rejects external or executable destinations", () => {
  assert.equal(
    getLoginDestination("/tickets?status=open", "agent"),
    "/tickets?status=open",
  );
  for (const next of [
    "//evil.example",
    "https://evil.example",
    "javascript:alert(1)",
    "/\\evil.example",
    "/login",
    "/signup?next=/tickets",
  ])
    assert.equal(getLoginDestination(next, "customer"), "/tickets/new");
  assert.equal(getLoginDestination(null, "admin"), "/dashboard");
  assert.equal(getLoginDestination(null, "agent"), "/tickets");
});
