class Task < ApplicationRecord

  validates :name, :start, presence: true

end
