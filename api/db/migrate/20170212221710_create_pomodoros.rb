class CreatePomodoros < ActiveRecord::Migration[5.0]
  def change
    create_table :pomodoros do |t|
      t.datetime :start, null: false, index: true
      t.datetime :finish, index: true
      t.string :type, null: false, index: true

      t.timestamps
    end
  end
end
