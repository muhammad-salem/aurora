import { Component, computed, JavaScriptInlineParser, OnInit, signal, Stack } from '@ibyar/aurora';


export type Cell = {
	row: number;
	col: string;
	expr: string
	value: string | number;
	calculated: boolean;
};

export class SheetIndexer implements ProxyHandler<Cell[][]> {

	constructor(private evaluate: (cell: Cell) => void) { }

	private getCell(target: Cell[][], p: string): Cell | undefined {
		const col = p.codePointAt(0)! - 65;
		const row = Number.parseInt(p.substring(1)) - 1;
		return target[row][col];
	}

	has(target: Cell[][], p: string): boolean {
		try {
			return this.getCell(target, p) !== undefined;
		} catch (ignore) {
			return false;
		}
	}
	get(target: Cell[][], p: string, receiver: any) {
		const cell = this.getCell(target, p);
		if (!cell) {
			return;
		}
		if (!cell.calculated) {
			this.evaluate(cell);
		}
		return cell.value;
	}
}

@Component({
	selector: 'excel-sheet',
	template: `<div class="card">
		<div class="card-body">
			<div class="card-title">
				<div class="mb-3">
					<label for="expr" class="form-label">{{current.col}}{{current.row}}</label>
					<input id="expr" name="expr" type="text" class="form-control" placeholder="Fx"
						[(value)]="current.expr" (change)="evaluateExpr()">
				</div>
			</div>
			<div class="card-text">
				<div class="d-flex">
					<table class="table table-dark table-bordered border-success-subtle ">
						<thead>
							<tr>
								<th scope="col">#</th>
								@for(let header of headers) {
									<th scope="col">{{header}}</th>
								}
							</tr>
						</thead>
						<tbody>
							@for(let row of sheet; let rowNum = index + 1;){
								<tr [class]="{'table-active': highlight.row == rowNum && !highlight.col}">
									<th id="{{rowNum}}" scope="row" @click="highlightRow(rowNum)">{{rowNum}}</th>
									@for(let cell of row) {
										<td id="{{cell.col+cell.row}}" [class]="{'table-active': highlight == cell}"
											@click="selectCell(cell)">
											{{cell.value}}
										</td>
									}
								</tr>
							}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>`
})
export class ExcelSheetComponent implements OnInit {

	sheet = signal<Cell[][]>([]);
	headers = computed<string[]>(() => this.sheet.get()[0].map(cell => cell.col));
	numbers = computed<number[]>(() => this.sheet.get().map((_, index) => index));


	current = signal<Cell>();
	highlight = signal<{ row: number, col?: string }>();


	onInit(): void {
		const sheet = [];
		for (let row = 1; row < 50; row++) {
			const rows: Cell[] = [];
			for (let col = 'A'; col <= 'Z'; col = String.fromCharCode(col.codePointAt(0)! + 1)) {
				rows.push({ row, col, expr: '', value: '', calculated: false });
			}
			sheet.push(rows);
		}
		this.sheet.set(sheet);

		sheet[0][0].expr = '2.3';
		sheet[0][1].expr = 'A1 + 2.7';
		sheet[0][2].expr = 'PI';
		sheet[0][3].expr = 'trunc(C1)';

		this.selectCell(this.sheet.get()[0][0]);

		this.evaluateExpr();
	}

	evaluateExpr() {
		const sheet = this.sheet.get();
		const indexer = new Proxy(sheet, new SheetIndexer(cell => evalCell(cell)));
		const stack = Stack.for(indexer, Math);
		const evalCell = (cell: Cell) => {
			const ast = JavaScriptInlineParser.parse(cell.expr);
			cell.value = ast.get(stack);
			cell.calculated = true;
		};
		sheet.forEach(row => row.forEach(cell => {
			if (cell.calculated) {
				return;
			}
			evalCell(cell);
		}));
		this.updateSheetRef();
	}

	updateSheetRef() {
		// clone array and reset calculated
		const selected = this.current.get();
		this.sheet.set(this.sheet.get().map(row => row.map(cell => Object.assign({}, cell, { calculated: false }))));
		const newSelectedRf = this.sheet.get().flatMap(arr => arr).find(cell => cell.row == selected.row && cell.col == selected.col);
		newSelectedRf && this.current.set(newSelectedRf);
	}

	highlightRow(rowNum: number) {
		this.highlight.set({ row: rowNum });
	}

	selectCell(cell: Cell) {
		this.current.set(cell);
		this.highlight.set(cell);
	}

}