ALTER TABLE `structures` ADD `isPublic` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `structures` ADD `isTemplate` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `structures` ADD `originalStructureId` int;