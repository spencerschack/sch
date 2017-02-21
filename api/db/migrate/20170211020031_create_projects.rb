class CreateProjects < ActiveRecord::Migration[5.0]
  def change
    create_table :projects do |t|
      t.string :name, null: false, index: { unique: true }
      t.references :parent, index: true, foreign_key: { to_table: :projects }

      t.timestamps
    end
  end
end
