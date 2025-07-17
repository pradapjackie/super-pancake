

# 🥞 Contributing to Super Pancake

Welcome! 🎉 We're excited that you're interested in contributing to **Super Pancake**, a lightweight and blazing-fast custom automation framework for Web UI and API testing. This document outlines how you can get involved and help make this project even better.

---

## 📦 Project Setup

To get started locally:

```bash
git clone https://github.com/pradapjackie/super-pancake.git
cd super-pancake
npm install
```

To run tests:

```bash
npm run test
```

To run the custom test UI:

```bash
npm run test-ui
```

---

## 🛠️ How to Contribute

### 🐛 Reporting Bugs

If you find a bug:

- Check if it’s already reported.
- If not, [open an issue](https://github.com/pradapjackie/super-pancake/issues/new) with:
  - Reproduction steps
  - Expected vs. actual behavior
  - Environment details (OS, Node version, browser)

### 🌟 Suggesting Enhancements

Have an idea to make Super Pancake better?

- Check open issues and discussions.
- If it's new, [create a feature request](https://github.com/pradapjackie/super-pancake/issues/new).
- Describe the use case and benefits clearly.

### 💻 Submitting Code

1. Fork the repo and create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes with clear, concise commits.

3. Run lint and tests to verify:
   ```bash
   npm run lint
   npm test
   ```

4. Push and open a Pull Request (PR) with a detailed description.

---

## 🧹 Code Style Guidelines

- Follow the structure and naming conventions used in the project.
- Use `async/await` over callbacks where applicable.
- Keep code modular and well-commented.
- For UI test scripts, prefer selectors that are robust (e.g. data-testid).
- Use Prettier formatting (we recommend installing the extension).

---

## ✅ Pull Request Checklist

Before submitting:

- [ ] Code is linted and tested
- [ ] All CI checks pass
- [ ] PR description includes purpose, scope, and screenshots (if applicable)
- [ ] Linked to related issues (if any)

---

## 🤝 Community & Support

- Join the discussion in [Issues](https://github.com/pradapjackie/super-pancake/issues).
- If you're unsure how to do something, feel free to ask.
- Be respectful and constructive in all interactions.

---

## 👏 Acknowledgements

Thanks for being part of Super Pancake! Every contribution — big or small — moves the project forward. 🍽️

