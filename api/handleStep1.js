import axios from 'https://esm.sh/axios@1.4.0';

/**
 * Handle Step 1: DeepSeek API Call
 * @param {Object} state - The global state object
 */
export async function handleStep1(state) {
  const { deepseekApiKey, deepseekEndpoint, deepseekModel, maxTokens, temperature, code, language } = state;

  // Utilize helper functions from index.html
  window.clearError();
  window.hideElement('deepseekSuggestions');
  window.hideElement('kinxSuggestions');

  if (!deepseekApiKey.trim()) {
    window.showError("[DeepSeek] API key is required.");
    return;
  }
  if (!code.trim()) {
    window.showError("Please enter some code to analyze.");
    return;
  }
  if (temperature < 0 || temperature > 1) {
    window.showError("Temperature must be between 0 and 1.");
    return;
  }
  if (maxTokens < 1 || maxTokens > 4096) {
    window.showError("Max tokens must be between 1 and 4096.");
    return;
  }

  window.showLoading();

  try {
    const payload = {
      model: deepseekModel,
      messages: [
        {
          role: "system",
          content: "You are an AI code reviewer and editor."
        },
        {
          role: "user",
          content: `Analyze the following ${language} code:\n${code}`
        }
      ],
      max_tokens: maxTokens,
      temperature: temperature
    };

    const response = await axios.post(deepseekEndpoint, payload, {
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = response.data;
    if (!data || !data.choices) {
      throw new Error("Invalid response from DeepSeek API.");
    }

    state.deepseekSuggestions = data.choices;
    state.step1Output = data.choices[0]?.message?.content || "";

    if (deepseekModel === "deepseek-reasoner") {
      state.reasoning = data.choices[0]?.message?.reasoning_content || "";
      if (state.reasoning) {
        document.getElementById('reasoningText').textContent = state.reasoning;
        window.showElement('reasoning');
      } else {
        window.hideElement('reasoning');
      }
    } else {
      window.hideElement('reasoning');
    }

    if (state.deepseekSuggestions.length > 0) {
      window.renderSuggestions(state.deepseekSuggestions);
    }

    window.updateHistory({
      timestamp: new Date().toLocaleString(),
      code: state.code,
      deepseekModel: state.deepseekModel,
      geminiModel: "(Not used in Step1)",
      deepseekSuggestions: state.deepseekSuggestions,
      kinxSuggestions: "(None yet)"
    });

    state.phase = 2;
  } catch (err) {
    window.showError(`Step1 Error: ${err.message}`);
  } finally {
    window.hideLoading();
  }
}