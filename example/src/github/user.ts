import { Component, Input, OnInit } from '@ibyar/aurora';

export interface User {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;

	name?: string;
	company?: string;
	blog?: string;
	location?: string;
	email?: string;
	hireable?: string;
	bio?: string;
	twitter_username?: string;
	public_repos?: number;
	public_gists?: number;
	followers?: number;
	following?: number;
	created_at?: string;
	updated_at?: string;
}


@Component({
	selector: 'user-view',
	template: `	<div class="card">
					<img src="{{user.avatar_url}}" class="card-img-top" alt="...">
				<div class="card-body">
					<h5 class="card-title">{{user.name}}</h5>
					<p class="card-text">{{user.login}} - {{user.bio}}</p>
				</div>
				<ul class="list-group list-group-flush">
					<li class="list-group-item">{{user.company}}</li>
					<li class="list-group-item">{{user.blog}}</li>
					<li class="list-group-item">{{user.location}}</li>
				</ul>
				<ul class="list-group list-group-flush">
					<li class="list-group-item">Following: {{user.following}}</li>
					<li class="list-group-item">Followers: {{user.followers}}</li>
					<li class="list-group-item">Public Repos: {{user.public_repos}}</li>
					<li class="list-group-item">Public Gists: {{user.public_gists}}</li>
				</ul>
				<div class="card-body">
					<a href="{{user.html_url}}" class="card-link">{{user.html_url}}</a>
					<a href="{{user.repos_url}}" class="card-link">{{user.repos_url}}</a>
				</div>
				</div>
			  `
})
export class UserCard implements OnInit {

	@Input()
	user: User;
	onInit(): void {
		fetch(this.user.url)
			.then(response => response.json())
			.then((user: User) => this.user = user);
	}

}


@Component({
	selector: 'user-list',
	template: `	<ul class="list-group">
					<li class="list-group-item" *for="let user of users">
						<user-view [user]="user"></user-view>
					</li>
				</ul>
			  `
})
export class UserList implements OnInit {

	users: User[] = [];
	onInit(): void {
		fetch('https://api.github.com/users')
			.then<User[]>(
				response => {
					if (response.status !== 200) {
						return Promise.resolve<User[]>([]);
					}
					return response.json();
				}
			)
			.then(users => this.users = users);
	}

}
