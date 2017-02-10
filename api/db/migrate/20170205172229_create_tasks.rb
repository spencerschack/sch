class CreateTasks < ActiveRecord::Migration[5.0]
  def change
    create_table :tasks do |t|
      t.string :name
      t.text :description
      t.datetime :start, null: false, index: true
      t.datetime :finish, index: true

      t.timestamps
    end
  end
end
