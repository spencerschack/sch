module RangeResource

  extend ActiveSupport::Concern

  VERIFY_DATE = proc { |values| DateTime.parse(values.first) }

  included do

    attributes :start, :finish

    filter :start, verify: VERIFY_DATE,
      apply: proc { |records, value|
        records.where('finish > ? OR finish IS NULL', value)
      }

    filter :finish, verify: VERIFY_DATE,
      apply: proc { |records, value|
        records.where('start < ?', value)
      }

    filter :current,
      apply: proc { |record|
        record.where(finish: nil)
      }

  end

end
