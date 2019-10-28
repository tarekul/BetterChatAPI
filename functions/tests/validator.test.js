const { validateLogin } = require("../utils/validator");

test("proper input email,pass and returns an obj with errs object and true", () => {
  expect(validateLogin("user@user.com", "12345")).toStrictEqual({
    errors: {},
    valid: true
  });
});

test("improper input email,pass and returns an obj with errs object false", () => {
  expect(validateLogin("user", "")).toStrictEqual({
    errors: {
      email: "Must enter correctly formatted email",
      password: "Must enter password"
    },
    valid: false
  });
});
