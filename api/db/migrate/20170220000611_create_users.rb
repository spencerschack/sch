class CreateUsers < ActiveRecord::Migration[5.0]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :persistent_token, null: false
      t.string :temporary_token, null: false

      t.timestamps
    end
    add_index :users, :email, unique: true
    add_index :users, :temporary_token, unique: true
    add_index :users, :persistent_token, unique: true
  end
end
