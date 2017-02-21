class AddUserIdToEverything < ActiveRecord::Migration[5.0]
  def change
    add_reference :tasks, :user, null: false, index: true, foreign_key: true
    add_reference :projects, :user, null: false, index: true, foreign_key: true
    add_reference :pomodoros, :user, null: false, index: true, foreign_key: true
  end
end
