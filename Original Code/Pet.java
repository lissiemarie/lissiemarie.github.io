
public class Pet {

	private String petType;
	private String petName;
	private int petAge;
	private int dogSpaces;
	private int catSpaces;
	private int daysStay;
	private double amountDue;
		
	/*Constructor*/
	public Pet() {
		petType = "none";
		petName = "none";
		petAge = 0;
		dogSpaces = 30;
		catSpaces = 12;
		daysStay = 0;
		amountDue = 0.0;
	}
	
	/*Setters*/
	public void setPetType(String type) {
		petType = type;
	}
	
	public void setPetName(String name) {
		petName = name;
	}
	
	public void setPetAge(int age) {
		petAge = age;
	}
	
	public void setDogSpaces (int dogSpace) {
		dogSpaces = dogSpace;
	}
	
	public void setCatSpaces (int catSpace) {
		catSpaces = catSpace;
	}
	
	public void setDaysStay (int days) {
		daysStay = days;
	}
	
	public void setAmountDue (double amount) {
		amountDue = amount;
	}
	
	/*Getters*/
	public String getPetType() {
		return petType;
	}
	
	public String getPetName() {
		return petName;
	}
	
	public int getPetAge() {
		return petAge;
	}
	
	public int getDogSpaces() {
		return dogSpaces;
	}
	
	public int getCatSpaces() {
		return catSpaces;
	}
	
	public int getDaysStay() {
		return daysStay;
	}
	
	public double getAmountDue() {
		return amountDue;
	}
	
	public void print() {
		System.out.println("Pet type: " + petType);
		System.out.println("Pet name: " + petName);
		System.out.println("Pet age: " + petAge);
		if(petType == "dog" || petType == "Dog") {
			System.out.println("Dog spaces: " + dogSpaces);
		if(petType == "cat" || petType == "Cat") {
			System.out.println("Cat spaces: " + catSpaces);
		}
		System.out.println("Days stay: " + daysStay);
		}
		System.out.println("Amount due: " + amountDue);
	}

}
