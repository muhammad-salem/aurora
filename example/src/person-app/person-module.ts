import { Module } from '@ibyar/aurora';
import { AddNoteDirective } from '../directive/add-note.directive.js';
import { NotifyUserDirective } from '../directive/notify-user.directive.js';
import { TimeDirective } from '../directive/time.directive.js';
import { ColorTogglerDirective } from '../directive/color-toggle.directive.js';
import { PersonEdit, PersonView } from './person.js';


@Module({
	imports: [
		AddNoteDirective,
		NotifyUserDirective,
		TimeDirective,
		ColorTogglerDirective,
		PersonView,
		PersonEdit,
	],
})
export class PersonModule {

}
