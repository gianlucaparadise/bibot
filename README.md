# bibot

Bibot is a bot for Telegram that reminds you to take the birth control pill.
You can add bibot using this link: [@bibopill_bot](http://telegram.me/bibopill_bot).

## Usage

Commands:

* `/start`: You can configure a reminder or replace the previous one
* `/check`: You can check the options of your reminder
* `/stop`: You can delete your reminder

## Reminder settings

During the configuration phase you need to set:

* **Pill type**:
	* type **28** reminds you every day at the given time
	* type **21** reminds you only for three weeks and is silent for the third week
* **First day of pill**: it's used to calculate the 21 days
* **Location**: it's used only to calculate your timezone and it's not stored. If you don't want to send your location, you can use the London time, but you need to choose the reminder time accordingly
* **Reminder time**: time of the reminder