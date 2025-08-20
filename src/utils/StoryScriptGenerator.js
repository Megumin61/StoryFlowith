export class StoryScriptGenerator {
    constructor(locale) {
        this.t = locale.storyScript.generator;
        this.emotionLabels = {
            'frown': locale.emotions.frustrated,
            'meh': locale.emotions.neutral,
            'smile': locale.emotions.relieved,
            'lightbulb': locale.emotions.inspired,
            'frustrated': locale.emotions.frustrated,
            'neutral': locale.emotions.neutral,
            'relieved': locale.emotions.relieved
        };
    }

    generateScript(storyData) {
        if (!storyData || storyData.length === 0) {
            return `<p class="text-gray-500">${this.t.noData}</p>`;
        }

        const userRole = this.extractUserRole(storyData);
        const behaviorGoals = this.extractBehaviorGoals(storyData);
        const usageScenarios = this.extractUsageScenarios(storyData);
        const emotionalJourney = this.extractEmotionalJourney(storyData);
        const plotPoints = this.extractPlotPoints(storyData);
        const storyTurns = this.extractStoryTurns(storyData);

        return `
            <div class="space-y-8">
                <div class="text-center border-b border-gray-200 pb-6">
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">${this.t.title}</h1>
                    <p class="text-gray-600">${this.t.subtitle}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-blue-50 p-6 rounded-xl border border-blue-200">
                        <h2 class="text-xl font-bold text-blue-900 mb-3 flex items-center">
                            <i data-lucide="user" class="w-5 h-5 mr-2"></i>
                            ${this.t.userRole}
                        </h2>
                        <div class="text-blue-800">${userRole}</div>
                    </div>

                    <div class="bg-green-50 p-6 rounded-xl border border-green-200">
                        <h2 class="text-xl font-bold text-green-900 mb-3 flex items-center">
                            <i data-lucide="target" class="w-5 h-5 mr-2"></i>
                            ${this.t.behaviorGoals}
                        </h2>
                        <div class="text-green-800">${behaviorGoals}</div>
                    </div>
                </div>

                <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h2 class="text-xl font-bold text-gray-900 mb-3 flex items-center">
                        <i data-lucide="map-pin" class="w-5 h-5 mr-2"></i>
                        ${this.t.usageScenarios}
                    </h2>
                    <div class="text-gray-700">${usageScenarios}</div>
                </div>

                <div class="bg-purple-50 p-6 rounded-xl border border-purple-200">
                    <h2 class="text-xl font-bold text-purple-900 mb-3 flex items-center">
                        <i data-lucide="heart" class="w-5 h-5 mr-2"></i>
                        ${this.t.emotionalJourney}
                    </h2>
                    <div class="space-y-3">
                        ${emotionalJourney}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                        <h2 class="text-xl font-bold text-yellow-900 mb-3 flex items-center">
                            <i data-lucide="bookmark" class="w-5 h-5 mr-2"></i>
                            ${this.t.plotPoints}
                        </h2>
                        <div class="space-y-2 text-yellow-800">
                            ${plotPoints}
                        </div>
                    </div>

                    <div class="bg-red-50 p-6 rounded-xl border border-red-200">
                        <h2 class="text-xl font-bold text-red-900 mb-3 flex items-center">
                            <i data-lucide="zap" class="w-5 h-5 mr-2"></i>
                            ${this.t.storyTurns}
                        </h2>
                        <div class="space-y-2 text-red-800">
                            ${storyTurns}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    extractUserRole(storyData) {
        const firstFrame = storyData[0];
        if (firstFrame && firstFrame.description) {
            const match = firstFrame.description.match(new RegExp('([\\u4e00-\\u9fa5]+[\\u4e00-\\u9fa5]*)', 'i'));
            if (match) {
                return this.t.userRoleTemplate.replace('{name}', match[1]);
            }
        }
        return this.t.defaultUserRole;
    }

    extractBehaviorGoals(storyData) {
        const goals = [];
        storyData.forEach(frame => {
            if (frame.emotion === 'lightbulb' || frame.emotion === 'smile') {
                goals.push(this.t.goalTemplate.replace('{action}', this.extractActionFromDescription(frame.description)));
            }
        });
        return goals.length > 0 ? goals.join('��') : this.t.defaultGoal;
    }

    extractUsageScenarios(storyData) {
        const scenarios = [];
        storyData.forEach(frame => {
            if (frame.description) {
                const location = this.extractLocationFromDescription(frame.description);
                if (location) {
                    scenarios.push(location);
                }
            }
        });
        const uniqueScenarios = [...new Set(scenarios)];
        return uniqueScenarios.length > 0 ? uniqueScenarios.join('��') : this.t.defaultScenario;
    }

    extractEmotionalJourney(storyData) {
        return storyData.map((frame, index) => {
            const emotion = this.emotionLabels[frame.emotion] || this.t.unknownEmotion;
            const title = frame.title.includes('. ') ? frame.title.split('. ')[1] : frame.title;
            return `
                <div class="flex items-center space-x-3">
                    <span class="flex items-center justify-center w-6 h-6 rounded-full bg-purple-200 text-purple-700 font-bold text-sm">${index + 1}</span>
                    <span class="font-medium">${title}</span>
                    <span class="text-purple-600">�� ${emotion}</span>
                </div>
            `;
        }).join('');
    }

    extractPlotPoints(storyData) {
        return storyData.map((frame, index) => {
            const title = frame.title.includes('. ') ? frame.title.split('. ')[1] : frame.title;
            return `<div class="flex items-start space-x-2">
                <span class="text-yellow-600 font-bold">${index + 1}.</span>
                <span>${title}</span>
            </div>`;
        }).join('');
    }

    extractStoryTurns(storyData) {
        const turns = [];
        storyData.forEach((frame, index) => {
            if (frame.emotion === 'lightbulb' || (index > 0 && frame.emotion !== storyData[index - 1].emotion)) {
                const title = frame.title.includes('. ') ? frame.title.split('. ')[1] : frame.title;
                turns.push(`<div class="flex items-start space-x-2">
                    <i data-lucide="corner-down-right" class="w-4 h-4 text-red-600 mt-1"></i>
                    <span>${title}</span>
                </div>`);
            }
        });
        return turns.length > 0 ? turns.join('') : `<div class="text-red-700">${this.t.noTurns}</div>`;
    }

    extractActionFromDescription(description) {
        if (description.includes('����')) return this.t.actions.manage;
        if (description.includes('����')) return this.t.actions.organize;
        if (description.includes('ʶ��')) return this.t.actions.recognize;
        return this.t.actions.operate;
    }

    extractLocationFromDescription(description) {
        if (description.includes('���⳵')) return this.t.locations.taxi;
        if (description.includes('�Ƶ�')) return this.t.locations.hotel;
        if (description.includes('�칫��')) return this.t.locations.office;
        if (description.includes('��')) return this.t.locations.home;
        return null;
    }
} 