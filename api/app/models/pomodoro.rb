class Pomodoro < ApplicationRecord

  include UserOwnedModel

  validates :start, presence: true
  validates :kind, presence: { in: %w(pomodoro break) }

end
