class User < ApplicationRecord

  has_secure_token :persistent_token
  has_secure_token :temporary_token

  has_many :tasks, dependent: :destroy
  has_many :projects, dependent: :destroy
  has_many :pomodoros, dependent: :destroy

end
