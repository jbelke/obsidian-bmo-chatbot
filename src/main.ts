import { Plugin, TFile } from 'obsidian';
import { BMOView, VIEW_TYPE_CHATBOT} from "./view";
import { BMOSettingTab } from './settings';
import { renameTitle } from './components/EditorCommands';

export interface BMOSettings {
	apiKey: string;
	max_tokens: string;
	model: string;
	system_role: string;
	temperature: number;
	userName: string;
	chatbotName: string;
	chatbotContainerBackgroundColor: string;
	userMessageBackgroundColor: string;
	botMessageBackgroundColor: string;
	chatHistoryPath: string;
	templateFilePath: string;
	openAIBaseUrl: string;
	ollamaRestAPIUrl: string;
	allowOllamaStream: boolean;
	localAIRestAPIUrl: string;
	referenceCurrentNote: boolean;
	allowRenameNoteTitle: boolean;
	allModels: string[];
	ollamaModels: string[];
	localAIModels: string[];
	openAIBaseModels: string[];
}

export const DEFAULT_SETTINGS: BMOSettings = {
	apiKey: '',
	max_tokens: '',
	model: '',
	system_role: '',
	temperature: 1.00,
	userName: 'USER',
	chatbotName: 'BMO',
	chatbotContainerBackgroundColor: '--background-secondary',
	userMessageBackgroundColor: '--background-primary',
	botMessageBackgroundColor: '--background-secondary',
	chatHistoryPath: 'BMO/',
	templateFilePath: '',
	openAIBaseUrl: 'https://api.openai.com/v1',
	ollamaRestAPIUrl: 'http://localhost:11434',
	allowOllamaStream: false,
	localAIRestAPIUrl: '',
	referenceCurrentNote: false,
	allowRenameNoteTitle: false,
	allModels: [],
	ollamaModels: [],
	localAIModels: [],
	openAIBaseModels: [],
}

export let checkActiveFile: TFile | null = null;

export default class BMOGPT extends Plugin {
	settings: BMOSettings;

	async onload() {
		await this.loadSettings();

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                this.handleFileSwitch();
            })
        );

		this.registerView(
			VIEW_TYPE_CHATBOT,
			(leaf) => new BMOView(leaf, this.settings, this)
		);

		this.addRibbonIcon("bot", "BMO Chatbot", () => {
			this.activateView();
		});

		this.addCommand({
            id: 'open-bmo-chatbot',
            name: 'Open BMO Chatbot',
            callback: () => {
                this.activateView();
            },
            hotkeys: [
				{
					modifiers: ['Mod'],
					key: '0',
				},
            ],
        });

		this.addCommand({
            id: 'rename-note-title',
            name: 'Rename Note Title',
            callback: () => {
				renameTitle(this.settings);
            },
            hotkeys: [
				{
					modifiers: ['Mod'],
					key: '\'',
				},
            ],
        });

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (!(file instanceof TFile)) {
					return;
				}
	
				menu.addItem((item) => {
					item
						.setTitle('BMO Chatbot: Generate new title')
						.onClick(() => renameTitle(this.settings));
				});
			})
		);

		this.addSettingTab(new BMOSettingTab(this.app, this));
	}

	handleFileSwitch() {
		checkActiveFile = this.app.workspace.getActiveFile();
	}

	async onunload() {
		this.app.workspace.getLeavesOfType(VIEW_TYPE_CHATBOT).forEach((leaf) => {
			const bmoView = leaf.view as BMOView;
	
			if (bmoView) {
				this.saveSettings();
				bmoView.cleanup();
			} 
		});
		
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_CHATBOT);
	
		const rightLeaf = this.app.workspace.getRightLeaf(false);
		await rightLeaf.setViewState({
			type: VIEW_TYPE_CHATBOT,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_CHATBOT)[0]
		);
	
		// Focus on the textarea
		const textarea = document.querySelector('.chatbox textarea') as HTMLTextAreaElement;
	
		if (textarea) {
			textarea.style.opacity = '0';
			textarea.style.transition = 'opacity 1s ease-in-out';
	
			setTimeout(() => {
				textarea.focus();
				textarea.style.opacity = '1';
			}, 50); 
		}
	
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_CHATBOT)[0]
		);
	
		const messageContainer = document.querySelector("#messageContainer");
		if (messageContainer) {
			messageContainer.scroll({
				top: messageContainer.scrollHeight, 
				behavior: 'smooth' 
			});
		}
	}
	

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}