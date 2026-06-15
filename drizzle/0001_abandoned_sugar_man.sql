CREATE TABLE `cookingSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipeId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`instruction` text NOT NULL,
	`instructionEn` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cookingSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `householdMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`householdId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('member','admin') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `householdMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `households` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`createdBy` int NOT NULL,
	`inviteCode` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `households_id` PRIMARY KEY(`id`),
	CONSTRAINT `households_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `ingredientChecklist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weeklyPlanId` int NOT NULL,
	`ingredientId` int NOT NULL,
	`isChecked` boolean NOT NULL DEFAULT false,
	`checkedBy` int,
	`checkedAt` timestamp,
	CONSTRAINT `ingredientChecklist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipeId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameEn` varchar(255),
	`quantity` varchar(100),
	`unit` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`householdId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameEn` varchar(255),
	`description` text,
	`cookingMethod` varchar(100) NOT NULL,
	`dishType` varchar(100) NOT NULL,
	`servings` int,
	`cookTimeMinutes` int,
	`sourceUrl` varchar(2048),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recipes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `toBuyList` (
	`id` int AUTO_INCREMENT NOT NULL,
	`householdId` int NOT NULL,
	`ingredientId` int,
	`itemName` varchar(255) NOT NULL,
	`itemNameEn` varchar(255),
	`quantity` varchar(100),
	`unit` varchar(50),
	`isChecked` boolean NOT NULL DEFAULT false,
	`checkedBy` int,
	`checkedAt` timestamp,
	`addedBy` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	`weekStartDate` timestamp NOT NULL,
	CONSTRAINT `toBuyList_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weeklyPlan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`householdId` int NOT NULL,
	`recipeId` int NOT NULL,
	`dayOfWeek` int,
	`mealType` varchar(50),
	`addedBy` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	`weekStartDate` timestamp NOT NULL,
	CONSTRAINT `weeklyPlan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `loginMethod`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `lastSignedIn`;