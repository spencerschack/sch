# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20170220014144) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "login_requests", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "pomodoros", force: :cascade do |t|
    t.datetime "start",      null: false
    t.datetime "finish"
    t.string   "kind",       null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer  "user_id",    null: false
    t.index ["finish"], name: "index_pomodoros_on_finish", using: :btree
    t.index ["kind"], name: "index_pomodoros_on_kind", using: :btree
    t.index ["start"], name: "index_pomodoros_on_start", using: :btree
    t.index ["user_id"], name: "index_pomodoros_on_user_id", using: :btree
  end

  create_table "projects", force: :cascade do |t|
    t.string   "name",       null: false
    t.integer  "parent_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer  "user_id",    null: false
    t.index ["name"], name: "index_projects_on_name", unique: true, using: :btree
    t.index ["parent_id"], name: "index_projects_on_parent_id", using: :btree
    t.index ["user_id"], name: "index_projects_on_user_id", using: :btree
  end

  create_table "tasks", force: :cascade do |t|
    t.text     "description"
    t.datetime "start",       null: false
    t.datetime "finish"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
    t.integer  "project_id"
    t.string   "name",        null: false
    t.integer  "user_id",     null: false
    t.index ["finish"], name: "index_tasks_on_finish", using: :btree
    t.index ["project_id"], name: "index_tasks_on_project_id", using: :btree
    t.index ["start"], name: "index_tasks_on_start", using: :btree
    t.index ["user_id"], name: "index_tasks_on_user_id", using: :btree
  end

  create_table "users", force: :cascade do |t|
    t.string   "email",            null: false
    t.string   "persistent_token", null: false
    t.string   "temporary_token",  null: false
    t.datetime "created_at",       null: false
    t.datetime "updated_at",       null: false
    t.index ["email"], name: "index_users_on_email", unique: true, using: :btree
    t.index ["persistent_token"], name: "index_users_on_persistent_token", unique: true, using: :btree
    t.index ["temporary_token"], name: "index_users_on_temporary_token", unique: true, using: :btree
  end

  add_foreign_key "pomodoros", "users"
  add_foreign_key "projects", "projects", column: "parent_id"
  add_foreign_key "projects", "users"
  add_foreign_key "tasks", "projects"
  add_foreign_key "tasks", "users"
end
