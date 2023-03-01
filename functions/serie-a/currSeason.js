const currSeason = () => {
    const date = new Date()
    const year = date.getFullYear()
    if (date.getMonth() > 6) {
        return `${year}-${(year + 1).toString().slice(-2)}`
    }
    else {
        return `${year - 1}-${year.toString().slice(-2)}`
    }
}

export default currSeason