class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  search() {
    if (this.queryString.keyword) {
      this.query = this.query.find({
        name: {
          $regex: this.queryString.keyword,
          $options: "i",
        },
      });
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excluded = ["keyword", "page", "limit"];
    excluded.forEach((el) => delete queryObj[el]);

    this.query = this.query.find(queryObj);
    return this;
  }

  paginate(resultsPerPage) {
    const page = Number(this.queryString.page) || 1;
    const skip = resultsPerPage * (page - 1);
    this.query = this.query.limit(resultsPerPage).skip(skip);
    return this;
  }
}

export default APIFeatures;
