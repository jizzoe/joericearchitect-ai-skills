
# Complete Setup Guide: DeepSeek-V4 Pro, IntelliJ (Continue & Cline), Aider CLI, and MCP Servers

This guide covers getting your DeepSeek API key and setting up IntelliJ IDEA (via Continue and Cline), the terminal CLI (via Aider), and MCP web/browser servers.

---

## 1. Get Your DeepSeek API Key

1. Go to [platform.deepseek.com](https://platform.deepseek.com) and log in or create an account.
2. Go to **API Keys** in the left sidebar and click **Create API Key**.
3. Copy the key (starts with `sk-`). Save it somewhere secure.
4. Navigate to **Top-up** and load a small balance ($2–$5) to activate the endpoint.

---

## 2. Terminal CLI Environment Setup (For Aider & Global Usage)

Add your key and base URL to your global shell configuration to ensure CLI tools read it automatically.

1. Open your shell config (`~/.zshrc` or `~/.bashrc`):
   ```bash
   nano ~/.zshrc
   ```
2. Add the following environment variables:
   ```bash
   export DEEPSEEK_API_KEY="sk-your-deepseek-api-key"
   export OPENAI_API_KEY="sk-your-deepseek-api-key"
   export OPENAI_API_BASE="[https://api.deepseek.com](https://api.deepseek.com)"
   ```
3. Save and source your shell:
   ```bash
   source ~/.zshrc
   ```

---

## 3. Configure Aider CLI (Autonomous Terminal Pair Programmer)

1. Install Aider:
   ```bash
   pip install -U aider-chat
   ```
2. Create or edit your persistent Aider configuration at `~/.aider.conf.yml`:
   ```yaml
   model: deepseek/deepseek-v4-pro
   openai-api-key: sk-your-deepseek-api-key
   openai-api-base: [https://api.deepseek.com](https://api.deepseek.com)
   auto-commits: true
   yes-always: true
   auto-lint: true
   ```
   *Note: `--yes-always` pre-authorizes file modifications, auto-commits, and linter runs while executing in autonomous mode.*

3. Launch Aider in your project directory:
   ```bash
   aider --test-cmd "pytest"
   ```

---

## 4. Configure IntelliJ IDEA: Continue Plugin Setup

1. Open IntelliJ IDEA $\rightarrow$ **Settings/Preferences (`Cmd+,` / `Ctrl+Alt+S`)** $\rightarrow$ **Plugins**.
2. Search for **Continue**, click **Install**, and restart IntelliJ.
3. Open the **Continue** panel on the right sidebar and click the **Gear icon (⚙️)** to open `~/.continue/config.yaml` or `config.json`.
4. Paste the following configuration optimized for DeepSeek-V4 Pro and high-speed autocomplete:

```yaml
models:
  - title: "DeepSeek-V4 Pro"
    provider: "openai"
    model: "deepseek-v4-pro"
    apiKey: "sk-your-deepseek-api-key"
    apiBase: "[https://api.deepseek.com](https://api.deepseek.com)"
    requestOptions:
      extraBody:
        thinking:
          type: "enabled"

tabAutocompleteModel:
  title: "DeepSeek Flash Autocomplete"
  provider: "openai"
  model: "deepseek-v4-flash"
  apiKey: "sk-your-deepseek-api-key"
  apiBase: "[https://api.deepseek.com](https://api.deepseek.com)"

tools:
  - name: run_terminal_command
    policy: automatic
  - name: edit_file
    policy: automatic
  - name: create_new_file
    policy: automatic
```

---

## 5. Configure IntelliJ IDEA: Cline Plugin Setup

1. In IntelliJ IDEA, go to **Settings** $\rightarrow$ **Plugins** $\rightarrow$ **Marketplace**, search for **Cline**, install it, and restart.
2. Open the **Cline** sidebar panel and click the **Gear icon (⚙️)**.
3. Set the Provider Settings:
    - **API Provider:** `OpenAI Compatible`
    - **Base URL:** `https://api.deepseek.com`
    - **API Key:** `sk-your-deepseek-api-key`
    - **Model ID:** `deepseek-v4-pro`
4. Set Permissions (Autonomous with Safety Guardrails):
    - Navigate to **Cline Settings** $\rightarrow$ **Auto-Approve / Security Settings**.
    - **Check / Enable:**
        - ✅ Auto-approve reading files and workspace structure
        - ✅ Auto-approve writing / editing files
        - ✅ Auto-approve standard terminal command execution (e.g., `pytest`, `npm test`, `git status`)
    - **Uncheck / Block (Dangerous Operations):**
        - ❌ Block `rm -rf` or bulk deletion tools
        - ❌ Block force git pushes (`git push --force`)
        - ❌ Block direct production environment variable changes (`.env.production`)

---

## 6. Setup MCP Servers: Web Search & Chrome Automation

Regarding browser automation capabilities: **Yes, Puppeteer and Chrome DevTools MCP servers provide full RPA-like capabilities.** They allow LLMs to navigate live URLs, fill out input forms, click buttons using CSS/XPath selectors, execute custom JavaScript evaluations in browser context, capture screenshots, and read network or console logs.

Below are configurations for **Chrome DevTools MCP** (first priority, enabling live local Chrome inspection), **Puppeteer MCP** (headless fallback), and **Brave Search MCP** (for fast API-driven web text search).

Add this JSON block into your Cline or Continue MCP configuration file (in Cline: **Settings ⚙️ $\rightarrow$ MCP Servers $\rightarrow$ Edit Global MCP Config**):

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest"
      ]
    },
    "puppeteer": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-puppeteer"
      ],
      "env": {
        "PUPPETEER_LAUNCH_OPTIONS": "{\"headless\": true}"
      }
    },
    "brave-search": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "BSAu-your-brave-search-key-here"
      }
    }
  }
}
```

### Tool Capabilities Summary
- **Brave Search MCP:** Used for quick text searches across official documentation, GitHub repositories, Reddit, and technical forums.
- **Chrome DevTools MCP / Puppeteer MCP:** Used when deep RPA page interaction is required (e.g., inspecting rendered SPAs, clicking tabs, taking full-page screenshots, or evaluating JavaScript expressions on rendered web pages).