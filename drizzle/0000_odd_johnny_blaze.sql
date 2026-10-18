CREATE TABLE `families` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner` text NOT NULL,
	`invite` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `families_invite_unique` ON `families` (`invite`);--> statement-breakpoint
CREATE TABLE `lists` (
	`family` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`family` text NOT NULL,
	`user` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`family` text NOT NULL,
	`creator` text NOT NULL,
	`data` text NOT NULL,
	`created` text NOT NULL
);
