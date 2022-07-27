import Editor from '@toast-ui/editor';
import autoComplete from '@toast-ui/editor-plugin-dooray-auto-complete';
import doorayParser from '@toast-ui/editor-plugin-dooray-parser';

console.log(Editor);

const reWidgetRule =
	/(->>|->|-\\>\\>|-\\>)?\[([^[\]]*?)]\((dooray:\/\/\d+?\/([\w-]+)\/(\d+))\)/;

const dpOptions = {
	reDisabledParsing: {
		entity: reWidgetRule,
	},
};

const suggestionInfo = {
	view: null,
	open: false,
	range: null,
	current: 0,
};

function createSuggestionEl() {
	const suggestionEl = document.createElement('div');
	suggestionEl.setAttribute('id', 'suggestion');
	suggestionEl.innerHTML = `
          <div>suggestion 1</div>
          <div>suggestion 2</div>
          <div>suggestion 3</div>
        `;
	suggestionEl.style.display = 'none';
	document.body.appendChild(suggestionEl);

	return suggestionEl;
}

function setSuggestion(el) {
	el.style.display = suggestionInfo.open ? 'block' : 'none';

	const rect = document
		.getElementsByClassName('dooray-auto-complete')[0]
		?.getBoundingClientRect();

	if (!rect) {
		return;
	}
	// 두 번째 방법. 에디터 내부 인터페이스 사용
	const pos = editor
		.getCurrentModeEditor()
		.view.coordsAtPos?.(suggestionInfo.range.from);

	el.style.top = `${pos.top + pos.bottom - pos.top}px`;
	el.style.left = `${pos.left}px`;

	[...el.children].forEach((item, index) => {
		item.classList[index === suggestionInfo.current ? 'add' : 'remove'](
			'selected',
		);
	});
}

const suggestionEl = createSuggestionEl();

[...suggestionEl.children].forEach((item) => {
	item.addEventListener('click', () => {
		if (!suggestionInfo.view) {
			return;
		}
		suggestionInfo.open = false;
		setSuggestion(suggestionEl);

		if (!suggestionInfo.range) {
			return;
		}
		const tr = suggestionInfo.view.state.tr
			.deleteRange(suggestionInfo.range.from, suggestionInfo.range.to)
			.insertText(`select ${suggestionInfo.current + 1}`);
		suggestionInfo.view.dispatch(tr);
		suggestionInfo.view.focus();
	});
});

const option = {
	reducer: function (action) {
		switch (action.act) {
			case 'open':
				console.log('open suggestion');
				suggestionInfo.open = true;
				suggestionInfo.range = action.range;
				setSuggestion(suggestionEl);
				return true;
			case 'enter':
				console.log('entered suggestion');
				suggestionInfo.open = false;
				setSuggestion(suggestionEl);

				// 에디터 인스턴스의 API를 활용하는 방식으로 변경되었습니다.
				// 위젯룰을 적용하는 단계가 transaction을 생성하는 단계 이전에 수행되어야 하지만,
				// 이 단계에서 transaction을 생성 후 dispatch하면 위젯룰이 적용되지 않습니다.
				// 따라서 위젯룰을 적용 후 transaction을 생성하는 에디터 API를 사용하는 방식으로 변경하였습니다.
				const [from, to] = editor.convertPosToMatchEditorMode(
					action.range.from,
					action.range.to,
				);

				editor.replaceWithWidget(
					from,
					to,
					`[@가나다](dooray://1387695619080878080/tasks/3027615930754185470)`,
				);

				/* 기존 코드 삭제
				const tr = action.view.state.tr
			    .deleteRange(action.range.from, action.range.to)
			    .insertText(`[@가나다](dooray://1387695619080878080/tasks/3027615930754185470)`, action.range.from);
			  action.view.dispatch(tr);
        */

				return true;
			case 'ArrowUp':
				suggestionInfo.current -= 1;
				suggestionInfo.current += suggestionEl.children.length;
				suggestionInfo.current %= suggestionEl.children.length;

				console.log('arrow up suggestion', suggestionInfo.current);
				setSuggestion(suggestionEl);
				return true;
			case 'ArrowDown':
				suggestionInfo.current += 1;
				suggestionInfo.current %= suggestionEl.children.length;

				console.log('arrow down suggestion', suggestionInfo.current);
				setSuggestion(suggestionEl);
				return true;
			case 'ArrowLeft':
				console.log('arrow left');
				return true;
			case 'ArrowRight':
				console.log('arrow right');
				return true;
			case 'close':
				suggestionInfo.open = false;
				setSuggestion(suggestionEl);
				console.log('close suggestion');
				break;
			default:
				break;
		}
	},
	triggers: [
		{
			name: 'mention',
			regex: /(^@|([()]|(->|(->>))|\s)@)$/,
			cancelWithSpace: true,
		}, // /[^`(\s|\w|\d)*][\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"](@)$/
		// autoComplete 플러그인 내에서 '[' 앞이 whiteSpace 문자일 때만 트리거하도록 수정되어서 트리거 정규식을 수정했습니다.
		{ name: 'task', regex: /(\[)$/, cancelWithSpace: false },
	],
};

const editor = new Editor({
	el: document.querySelector('#editor'),
	previewStyle: 'vertical',
	height: '500px',
	initialValue: '',
	useCommandShortcut: false,
	plugins: [
		[autoComplete, option],
		[doorayParser, dpOptions],
	],
	widgetRules: [
		{
			rule: reWidgetRule,
			toDOM(text) {
				const rule = reWidgetRule;
				const matched = text.match(rule);
				const span = document.createElement('span');

				span.innerHTML = `<a class="widget-anchor" style="color: red;" href="/">${matched[2]}</a>`;
				return span;
			},
		},
	],
});

window.editor = editor;
