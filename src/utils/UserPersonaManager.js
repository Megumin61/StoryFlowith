export class UserPersonaManager {
    constructor() {
        this.personas = [];
        this.selectedPersonaId = null;
        this.nextPersonaId = 1;
    }

    initializeUI() {
        this.bindEventListeners();
        this.renderPersonasList();
    }

    bindEventListeners() {
        const addPersonaBtn = document.getElementById('add-persona-btn');
        const aiGeneratePersonaBtn = document.getElementById('ai-generate-persona-btn');
        const savePersonaBtn = document.getElementById('save-persona-btn');
        const deletePersonaBtn = document.getElementById('delete-persona-btn');

        if (addPersonaBtn) {
            addPersonaBtn.addEventListener('click', () => {
                this.createNewPersona();
            });
        }

        if (aiGeneratePersonaBtn) {
            aiGeneratePersonaBtn.addEventListener('click', () => {
                this.aiGeneratePersona();
            });
        }

        if (savePersonaBtn) {
            savePersonaBtn.addEventListener('click', () => {
                this.saveCurrentPersona();
            });
        }

        if (deletePersonaBtn) {
            deletePersonaBtn.addEventListener('click', () => {
                this.deleteCurrentPersona();
            });
        }
    }

    createNewPersona() {
        const newPersona = {
            id: this.nextPersonaId++,
            name: '',
            age: '',
            occupation: '',
            goals: '',
            scenarios: '',
            frustrations: '',
            techLevel: 'intermediate'
        };
        
        this.personas.push(newPersona);
        this.selectedPersonaId = newPersona.id;
        this.renderPersonasList();
        this.showPersonaEditor(newPersona);
    }

    async aiGeneratePersona() {
        const researchData = document.getElementById('research-data-input')?.value;
        
        if (!researchData?.trim()) {
            alert('���������û���������');
            return;
        }

        try {
            const generatedPersona = await this.generatePersonaFromResearch(researchData);
            const newPersona = {
                id: this.nextPersonaId++,
                ...generatedPersona
            };
            
            this.personas.push(newPersona);
            this.selectedPersonaId = newPersona.id;
            this.renderPersonasList();
            this.showPersonaEditor(newPersona);
        } catch (error) {
            console.error('AI�����û���ɫʧ��:', error);
            alert('AI����ʧ�ܣ������������ӻ��Ժ�����');
        }
    }

    async generatePersonaFromResearch(researchData) {
        // �򻯴�����ʵ����Ŀ��Ӧ�����ӵ���ʵ��API
        return {
            name: '���ɵ��û�',
            age: '25-35��',
            occupation: '���ڵ������ݵ�ְҵ',
            goals: '���ݵ������ݷ����ó���Ŀ��',
            scenarios: '���ڵ������ݵ�ʹ�ó���',
            frustrations: '�����з��ֵ���Ҫʹ��',
            techLevel: 'intermediate'
        };
    }

    saveCurrentPersona() {
        if (!this.selectedPersonaId) return;

        const persona = this.personas.find(p => p.id === this.selectedPersonaId);
        if (!persona) return;

        const nameEl = document.getElementById('persona-name');
        const ageEl = document.getElementById('persona-age');
        const occupationEl = document.getElementById('persona-occupation');
        const goalsEl = document.getElementById('persona-goals');
        const scenariosEl = document.getElementById('persona-scenarios');
        const frustrationsEl = document.getElementById('persona-frustrations');
        const techLevelEl = document.getElementById('persona-tech-level');

        if (nameEl && ageEl && occupationEl && goalsEl && scenariosEl && frustrationsEl && techLevelEl) {
            persona.name = nameEl.value;
            persona.age = ageEl.value;
            persona.occupation = occupationEl.value;
            persona.goals = goalsEl.value;
            persona.scenarios = scenariosEl.value;
            persona.frustrations = frustrationsEl.value;
            persona.techLevel = techLevelEl.value;
        }

        this.renderPersonasList();
        alert('�û���ɫ�ѱ���');
    }

    deleteCurrentPersona() {
        if (!this.selectedPersonaId) return;
        
        if (window.confirm('ȷ��Ҫɾ������û���ɫ��')) {
            this.personas = this.personas.filter(p => p.id !== this.selectedPersonaId);
            this.selectedPersonaId = null;
            this.renderPersonasList();
            this.hidePersonaEditor();
        }
    }

    renderPersonasList() {
        const listContent = document.getElementById('personas-list-content');
        if (!listContent) return;
        
        if (this.personas.length === 0) {
            listContent.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i data-lucide="users" class="w-8 h-8 mx-auto mb-2"></i>
                    <p class="text-sm">�����û���ɫ</p>
                </div>
            `;
            return;
        }

        listContent.innerHTML = this.personas.map(persona => `
            <div class="persona-item p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${persona.id === this.selectedPersonaId ? 'bg-blue-50 border-blue-300' : ''}" data-persona-id="${persona.id}">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <i data-lucide="user" class="w-5 h-5 text-blue-600"></i>
                    </div>
                    <div class="flex-grow">
                        <h4 class="font-medium text-gray-900">${persona.name || 'δ�����û�'}</h4>
                        <p class="text-sm text-gray-500">${persona.occupation || 'ְҵδ����'}</p>
                    </div>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.persona-item').forEach(item => {
            item.addEventListener('click', () => {
                const personaId = parseInt(item.dataset.personaId);
                this.selectPersona(personaId);
            });
        });

        // ��ȫ�ص���lucideͼ�괴��
        if (typeof window !== 'undefined' && window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    selectPersona(personaId) {
        this.selectedPersonaId = personaId;
        const persona = this.personas.find(p => p.id === personaId);
        if (persona) {
            this.showPersonaEditor(persona);
            this.renderPersonasList();
        }
    }

    showPersonaEditor(persona) {
        const placeholder = document.getElementById('persona-editor-placeholder');
        const editor = document.getElementById('persona-editor');
        
        if (!placeholder || !editor) return;
        
        placeholder.classList.add('hidden');
        editor.classList.remove('hidden');

        const nameEl = document.getElementById('persona-name');
        const ageEl = document.getElementById('persona-age');
        const occupationEl = document.getElementById('persona-occupation');
        const goalsEl = document.getElementById('persona-goals');
        const scenariosEl = document.getElementById('persona-scenarios');
        const frustrationsEl = document.getElementById('persona-frustrations');
        const techLevelEl = document.getElementById('persona-tech-level');

        if (nameEl) nameEl.value = persona.name || '';
        if (ageEl) ageEl.value = persona.age || '';
        if (occupationEl) occupationEl.value = persona.occupation || '';
        if (goalsEl) goalsEl.value = persona.goals || '';
        if (scenariosEl) scenariosEl.value = persona.scenarios || '';
        if (frustrationsEl) frustrationsEl.value = persona.frustrations || '';
        if (techLevelEl) techLevelEl.value = persona.techLevel || 'intermediate';
    }

    hidePersonaEditor() {
        const placeholder = document.getElementById('persona-editor-placeholder');
        const editor = document.getElementById('persona-editor');
        
        if (!placeholder || !editor) return;
        
        placeholder.classList.remove('hidden');
        editor.classList.add('hidden');
    }
} 