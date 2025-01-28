import axios from 'https://esm.sh/axios@1.4.0';

/**
 * Handle Step 2: Gemini (Kin-X) API Call
 * @param {Object} state - The global state object
 */
export async function handleStep2(state) {
  const { geminiApiKey, geminiEndpoint, geminiModel, code, language, step1Output, virtualBrains } = state;

  window.clearError();

  if (!geminiApiKey.trim()) {
    window.showError("[Gemini] API key is required.");
    return;
  }
  if (!step1Output.trim()) {
    window.showError("Complete Step1 first.");
    return;
  }

  window.showLoading();

  try {
    let kinxOutput = "**Kin-X (Gemini) Analysis:**\n\n";
    for (const brain of virtualBrains) {
      kinxOutput += `**${brain.name}:**\n`;

      const promptWithStep1 = `You are Kin-X in role '${brain.name}'.\n` +
        `DeepSeek's Step1 Analysis:\n${step1Output}\n\n` +
        `Your Task:\n${brain.prompt}\n\n` +
        `Provide detailed analysis and suggestions:`;

      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: promptWithStep1
              }
            ]
          }
        ]
      };

      const response = await axios.post(`${geminiEndpoint}?key=${geminiApiKey}`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status !== 200) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = response.data;
      const geminiCandidates = data?.candidates || [];

      if (geminiCandidates.length > 0) {
        const candidateText = geminiCandidates[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          kinxOutput += candidateText + "\n\n";
        } else {
          kinxOutput += "(No text)\n\n";
        }
      } else {
        kinxOutput += "(No candidates)\n\n";
      }
    }

    state.kinxSuggestions = kinxOutput;
    window.showKinxSuggestions();

    window.updateHistory({
      timestamp: new Date().toLocaleString(),
      code: state.code,
      deepseekModel: "(Used in Step1)",
      geminiModel: state.geminiModel,
      deepseekSuggestions: [],
      kinxSuggestions: kinxOutput
    });
  } catch (err) {
    window.showError(`Step2 Error: ${err.message}`);
  } finally {
    window.hideLoading();
  }
}